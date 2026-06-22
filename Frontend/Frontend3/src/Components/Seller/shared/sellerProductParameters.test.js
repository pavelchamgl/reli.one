import { describe, expect, it } from "vitest";
import {
    areProductParametersValid,
    getVisibleProductParameters,
    isDimensionParameterRow,
    isEmptyParameterRow,
} from "./sellerProductParameters.js";

describe("sellerProductParameters", () => {
    describe("isDimensionParameterRow", () => {
        it("treats length/width/height/weight as dimension rows (case-insensitive)", () => {
            expect(isDimensionParameterRow({ name: "Length", value: "10" })).toBe(true);
            expect(isDimensionParameterRow({ name: "WIDTH", value: "20" })).toBe(true);
            expect(isDimensionParameterRow({ name: "height", value: "30" })).toBe(true);
            expect(isDimensionParameterRow({ name: "WEIGHT", value: "1" })).toBe(true);
        });

        it("treats regular characteristics as visible rows", () => {
            expect(isDimensionParameterRow({ name: "Color", value: "Red" })).toBe(false);
        });
    });

    describe("getVisibleProductParameters", () => {
        it("returns empty array for null, undefined, and non-array input", () => {
            expect(getVisibleProductParameters(null)).toEqual([]);
            expect(getVisibleProductParameters(undefined)).toEqual([]);
            expect(getVisibleProductParameters("invalid")).toEqual([]);
        });

        it("filters dimension rows from a mixed array", () => {
            const parameters = [
                { name: "Color", value: "Red" },
                { name: "Length", value: "100" },
                { name: "Material", value: "Cotton" },
                { name: "weight", value: "2" },
            ];

            expect(getVisibleProductParameters(parameters)).toEqual([
                { name: "Color", value: "Red" },
                { name: "Material", value: "Cotton" },
            ]);
        });
    });

    describe("isEmptyParameterRow", () => {
        it("treats rows with both name and value blank as empty", () => {
            expect(isEmptyParameterRow({ name: "", value: "" })).toBe(true);
            expect(isEmptyParameterRow({ name: "   ", value: "\t" })).toBe(true);
            expect(isEmptyParameterRow({})).toBe(true);
            expect(isEmptyParameterRow(null)).toBe(true);
        });

        it("treats rows with any non-blank field as non-empty", () => {
            expect(isEmptyParameterRow({ name: "Color", value: "" })).toBe(false);
            expect(isEmptyParameterRow({ name: "", value: "Red" })).toBe(false);
            expect(isEmptyParameterRow({ name: "Color", value: "Red" })).toBe(false);
        });
    });

    describe("areProductParametersValid", () => {
        it("treats untouched / empty input as valid (block is optional)", () => {
            expect(areProductParametersValid(null)).toBe(true);
            expect(areProductParametersValid(undefined)).toBe(true);
            expect(areProductParametersValid([])).toBe(true);
        });

        it("ignores fully empty placeholder rows (add -> delete leftover)", () => {
            expect(areProductParametersValid([{ name: "", value: "" }])).toBe(true);
            expect(
                areProductParametersValid([
                    { name: "", value: "" },
                    { name: "   ", value: "" },
                ])
            ).toBe(true);
        });

        it("treats a partially filled row as invalid", () => {
            expect(areProductParametersValid([{ name: "Color", value: "" }])).toBe(false);
            expect(areProductParametersValid([{ name: "", value: "Red" }])).toBe(false);
        });

        it("treats fully filled rows as valid", () => {
            expect(
                areProductParametersValid([
                    { name: "Color", value: "Red" },
                    { name: "Material", value: "Cotton" },
                ])
            ).toBe(true);
        });

        it("validates only the partially filled row among mixed rows", () => {
            expect(
                areProductParametersValid([
                    { name: "Color", value: "Red" },
                    { name: "", value: "" },
                    { name: "Material", value: "" },
                ])
            ).toBe(false);
        });

        it("excludes dimension rows from validation", () => {
            expect(
                areProductParametersValid([
                    { name: "Length", value: "" },
                    { name: "Color", value: "Red" },
                ])
            ).toBe(true);
        });
    });
});
