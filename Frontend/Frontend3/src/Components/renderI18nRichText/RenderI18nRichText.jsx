import React from "react";

const URL_RE = /\bhttps?:\/\/[^\s<]+[^\s<\.)\],:;"']\b/gi;
const NUMBER_RE = /\b\d+(?:[.,]\d+)?\b/g;
const LEADING_NUMBER_RE = /^\d+(?:\.\d+)*/;

export default function renderI18nRichText({
    text,
    numberClassName,
    linkClassName,
    headingNumberClassName
}) {
    const parts = [];

    let workingText = text||"";

    // ===== 1. Обрабатываем число в начале строки =====
    const leadingMatch = workingText.match(LEADING_NUMBER_RE);

    if (leadingMatch) {
        const value = leadingMatch[0];

        parts.push(
            <span key="leading" className={headingNumberClassName}>
                {value}
            </span>
        );

        workingText = workingText.slice(value.length);
    }

    // ===== 2. Дальше старая логика =====

    let lastIndex = 0;
    const urlMatches = [...workingText.matchAll(URL_RE)];

    const pushTextWithNumbers = (chunk, baseKey) => {
        let pos = 0;
        const matches = [...chunk.matchAll(NUMBER_RE)];

        if (matches.length === 0) {
            parts.push(chunk);
            return;
        }

        matches.forEach((m, i) => {
            const value = m[0];
            const idx = m.index ?? 0;

            if (idx > pos) parts.push(chunk.slice(pos, idx));

            parts.push(
                <span key={`${baseKey}-n-${i}`} className={numberClassName}>
                    {value}
                </span>
            );

            pos = idx + value.length;
        });

        if (pos < chunk.length) parts.push(chunk.slice(pos));
    };

    if (urlMatches.length === 0) {
        pushTextWithNumbers(workingText, "t");
        return parts;
    }

    urlMatches.forEach((m, i) => {
        const url = m[0];
        const start = m.index ?? 0;
        const end = start + url.length;

        if (start > lastIndex) {
            const before = workingText.slice(lastIndex, start);
            pushTextWithNumbers(before, `b-${i}`);
        }

        parts.push(
            <a
                key={`u-${i}`}
                href={url}
                className={linkClassName}
                target="_blank"
                rel="noopener noreferrer"
            >
                {url}
            </a>
        );

        lastIndex = end;
    });

    if (lastIndex < workingText.length) {
        const after = workingText.slice(lastIndex);
        pushTextWithNumbers(after, "a");
    }

    return parts;
}
