"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const node_assert_1 = __importDefault(require("node:assert"));
const drift_1 = require("./drift");
(0, node_test_1.describe)('Drift Math', () => {
    const KEELADI_LAT = 9.851;
    const KEELADI_LON = 78.219;
    (0, node_test_1.it)('smoke heading toward site (Fire West of site, Wind from West)', () => {
        // Fire is West of Keeladi (Lon is smaller, same Lat for simplicity)
        const fireLat = 9.851;
        const fireLon = 78.100;
        // Wind from West (270 degrees)
        // Means smoke goes East (90 degrees). 
        // Fire is West of site, so bearing from fire to site is exactly 90 (East).
        // Should be a direct hit.
        const result = (0, drift_1.calculateDriftRisk)(fireLat, fireLon, KEELADI_LAT, KEELADI_LON, 270, 10);
        node_assert_1.default.strictEqual(result.isWithinDriftCone, true);
        node_assert_1.default.ok(result.estimatedArrivalMinutes !== null && result.estimatedArrivalMinutes > 0);
    });
    (0, node_test_1.it)('smoke heading away from site (Fire West of site, Wind from East)', () => {
        // Fire is West of Keeladi
        const fireLat = 9.851;
        const fireLon = 78.100;
        // Wind from East (90 degrees)
        // Means smoke goes West (270 degrees).
        // Fire is West of site, but smoke goes further West, away from site.
        const result = (0, drift_1.calculateDriftRisk)(fireLat, fireLon, KEELADI_LAT, KEELADI_LON, 90, 10);
        node_assert_1.default.strictEqual(result.isWithinDriftCone, false);
        node_assert_1.default.strictEqual(result.estimatedArrivalMinutes, null);
    });
    (0, node_test_1.it)('smoke narrowly misses site due to spread angle', () => {
        const fireLat = 9.851;
        const fireLon = 78.100;
        // Bearing to site is 90 degrees.
        // If wind is from 200 degrees, smoke heads to 20 degrees.
        // 90 - 20 = 70 degrees difference, which is > 30 (DRIFT_CONE_SPREAD_DEGREES).
        const result = (0, drift_1.calculateDriftRisk)(fireLat, fireLon, KEELADI_LAT, KEELADI_LON, 200, 10);
        node_assert_1.default.strictEqual(result.isWithinDriftCone, false);
    });
});
