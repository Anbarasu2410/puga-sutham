export const KEELADI_LAT = 9.855924;
export const KEELADI_LON = 78.193178;

export async function fetchCurrentWind() {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${KEELADI_LAT}&longitude=${KEELADI_LON}&current=wind_speed_10m,wind_direction_10m`;

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch wind data: ${response.statusText}`);
    }

    const data = await response.json();

    return {
        windSpeedKmh: data.current.wind_speed_10m,
        windDirectionDeg: data.current.wind_direction_10m,
        recordedAt: data.current.time,
    };
}
