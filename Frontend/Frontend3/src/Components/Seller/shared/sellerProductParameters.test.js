import { describe, expect, it } from "vitest";
import {
    getVisibleProductParameters,
    isDimensionParameterRow,
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
});
