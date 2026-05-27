"""
Изоляция ошибок post-payment parcel flow (Task 005 / O2).

Без HTTP к курьерам: generate_parcels_for_order / fetch_and_store_labels_for_order
и письма из payment.services замоканы.
"""
from __future__ import annotations

from unittest.mock import MagicMock, patch

from django.test import SimpleTestCase

from delivery.utils_async import (
    async_parcels_and_seller_email,
    run_parcels_and_seller_email_after_commit,
)


def _patch_chain():
    """Патчи для синхронной цепочки (порядок аргументов снизу вверх у @patch)."""
    return (
        patch("delivery.utils_async.logger"),
        patch("delivery.utils_async.fetch_and_store_labels_for_order"),
        patch("delivery.utils_async.generate_parcels_for_order"),
        patch("payment.services.send_merged_manager_email_from_session"),
        patch("payment.services.send_seller_emails_by_session"),
    )


class RunParcelsAfterCommitErrorHandlingTests(SimpleTestCase):
    """Тесты run_parcels_and_seller_email_after_commit без executor/on_commit."""

    def test_generate_parcels_failure_one_order_does_not_block_next_or_emails(self):
        ctx = _patch_chain()
        mocks = [cm.__enter__() for cm in ctx]
        mock_log, mock_fetch, mock_gen, mock_mgr, mock_seller = mocks
        try:

            def gen_side_effect(oid):
                if oid == 101:
                    raise RuntimeError("parcel provider down")
                return None

            mock_gen.side_effect = gen_side_effect

            run_parcels_and_seller_email_after_commit([101, 202], "sess-a")

            mock_gen.assert_any_call(101)
            mock_gen.assert_any_call(202)
            mock_fetch.assert_called_once_with(202)
            mock_seller.assert_called_once_with("sess-a")
            mock_mgr.assert_called_once_with("sess-a")
            mock_log.exception.assert_called()
            parcels_calls = [
                c
                for c in mock_log.exception.call_args_list
                if c.args and isinstance(c.args[0], str) and "[PARCELS]" in c.args[0]
            ]
            self.assertEqual(len(parcels_calls), 1)
        finally:
            for cm in reversed(ctx):
                cm.__exit__(None, None, None)

    def test_fetch_labels_failure_logged_emails_still_sent(self):
        ctx = _patch_chain()
        mocks = [cm.__enter__() for cm in ctx]
        mock_log, mock_fetch, mock_gen, mock_mgr, mock_seller = mocks
        try:
            mock_fetch.side_effect = RuntimeError("label pdf failed")

            run_parcels_and_seller_email_after_commit([55], "sess-b")

            mock_gen.assert_called_once_with(55)
            mock_fetch.assert_called_once_with(55)
            mock_seller.assert_called_once_with("sess-b")
            mock_mgr.assert_called_once_with("sess-b")
            mock_log.exception.assert_called()
        finally:
            for cm in reversed(ctx):
                cm.__exit__(None, None, None)

    def test_seller_email_failure_manager_email_still_attempted(self):
        ctx = _patch_chain()
        mocks = [cm.__enter__() for cm in ctx]
        mock_log, mock_fetch, mock_gen, mock_mgr, mock_seller = mocks
        try:
            mock_seller.side_effect = RuntimeError("smtp seller")

            run_parcels_and_seller_email_after_commit([1], "sess-c")

            mock_seller.assert_called_once_with("sess-c")
            mock_mgr.assert_called_once_with("sess-c")
            seller_exc_calls = [
                c
                for c in mock_log.exception.call_args_list
                if c.args and isinstance(c.args[0], str) and "[PARCELS→SELLER]" in c.args[0]
            ]
            self.assertEqual(len(seller_exc_calls), 1)
        finally:
            for cm in reversed(ctx):
                cm.__exit__(None, None, None)

    def test_manager_email_failure_no_propagation(self):
        ctx = _patch_chain()
        mocks = [cm.__enter__() for cm in ctx]
        mock_log, mock_fetch, mock_gen, mock_mgr, mock_seller = mocks
        try:
            mock_mgr.side_effect = RuntimeError("smtp manager")

            run_parcels_and_seller_email_after_commit([1], "sess-d")

            mock_mgr.assert_called_once_with("sess-d")
            mgr_exc_calls = [
                c
                for c in mock_log.exception.call_args_list
                if c.args and isinstance(c.args[0], str) and "[PARCELS→MANAGER]" in c.args[0]
            ]
            self.assertEqual(len(mgr_exc_calls), 1)
        finally:
            for cm in reversed(ctx):
                cm.__exit__(None, None, None)

    def test_run_does_not_raise_when_parcel_and_email_failures(self):
        ctx = _patch_chain()
        mocks = [cm.__enter__() for cm in ctx]
        _mock_log, _mock_fetch, mock_gen, mock_mgr, mock_seller = mocks
        try:
            mock_gen.side_effect = RuntimeError("boom")
            mock_seller.side_effect = RuntimeError("seller boom")
            mock_mgr.side_effect = RuntimeError("mgr boom")

            try:
                run_parcels_and_seller_email_after_commit([7, 8], "sess-e")
            except Exception as exc:
                self.fail(f"Must not propagate: {exc}")
        finally:
            for cm in reversed(ctx):
                cm.__exit__(None, None, None)


class AsyncParcelsWiringTests(SimpleTestCase):
    """Проверка async_parcels_and_seller_email → on_commit → executor → sync runner."""

    def test_async_schedules_same_work_as_sync_runner(self):
        patch_on_commit = patch(
            "delivery.utils_async.transaction.on_commit",
            side_effect=lambda cb: cb(),
        )
        patch_submit = patch("delivery.utils_async.executor")
        patch_run = patch(
            "delivery.utils_async.run_parcels_and_seller_email_after_commit",
            wraps=run_parcels_and_seller_email_after_commit,
        )

        with patch_on_commit, patch_submit as ex, patch_run as run_mock:
            ex.submit.side_effect = lambda fn: fn()

            inner_gen = MagicMock()
            inner_fetch = MagicMock()
            inner_seller = MagicMock()
            inner_mgr = MagicMock()

            with (
                patch("delivery.utils_async.generate_parcels_for_order", inner_gen),
                patch("delivery.utils_async.fetch_and_store_labels_for_order", inner_fetch),
                patch(
                    "payment.services.send_seller_emails_by_session",
                    inner_seller,
                ),
                patch(
                    "payment.services.send_merged_manager_email_from_session",
                    inner_mgr,
                ),
            ):
                async_parcels_and_seller_email([301], "sess-wire")

            run_mock.assert_called_once_with([301], "sess-wire")
            inner_gen.assert_called_once_with(301)
            inner_fetch.assert_called_once_with(301)
            inner_seller.assert_called_once_with("sess-wire")
            inner_mgr.assert_called_once_with("sess-wire")
