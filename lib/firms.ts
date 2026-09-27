import { KEELADI_LAT, KEELADI_LON } from './weather';

// Roughly a 50km bounding box around Keeladi
const MIN_LON = KEELADI_LON - 0.5;
const MIN_LAT = KEELADI_LAT - 0.5;
const MAX_LON = KEELADI_LON + 0.5;
const MAX_LAT = KEELADI_LAT + 0.5;

const AREA = `${MIN_LON},${MIN_LAT},${MAX_LON},${MAX_LAT}`;
const SOURCE = 'VIIRS_SNPP_NRT'; // standard NRT VIIRS
const DAY_RANGE = 1;

export async function fetchActiveFires() {
    const mapKey = process.env.NASA_FIRMS_MAP_KEY;
    if (!mapKey) {
        throw new Error('NASA_FIRMS_MAP_KEY is not configured');
    }

    const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${mapKey}/${SOURCE}/${AREA}/${DAY_RANGE}`;

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch FIRMS data: ${response.statusText}`);
    }

    const csv = await response.text();
    return parseFirmsCsv(csv);
}

function parseFirmsCsv(csv: string) {
    const lines = csv.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    if (lines.length === 0) return [];

    const header = lines[0].split(',');
    const latIdx = header.indexOf('latitude');
    const lonIdx = header.indexOf('longitude');
    const confIdx = header.indexOf('confidence');
    const acqDateIdx = header.indexOf('acq_date');
    const acqTimeIdx = header.indexOf('acq_time');

    if (latIdx === -1 || lonIdx === -1) {
        throw new Error('Invalid FIRMS CSV structure');
    }

    const fires = [];

    // Skip header
    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',');

        // Some lines might be malformed, skip them
        if (cols.length < Math.max(latIdx, lonIdx, confIdx, acqDateIdx, acqTimeIdx)) continue;

        let confidenceValid = confIdx !== -1 ? cols[confIdx] : '0';
        let conf = confidenceValid === 'n' ? 0.5 : confidenceValid === 'l' ? 0.3 : confidenceValid === 'h' ? 1.0 : parseFloat(confidenceValid) / 100.0;
        if (isNaN(conf)) conf = 0.5; // fallback

        // Prevent Summer Error: Because summer causes severe ground heat, only accept "High" (1.0) confidence anomalies. 
        // This drops all "Nominal" or "Low" confidence spikes automatically.
        if (conf < 1.0) continue;

        // parse date/time to ISO string if possible
        let detectedAt = new Date().toISOString();
        if (acqDateIdx !== -1 && acqTimeIdx !== -1) {
            // date: YYYY-MM-DD, time: HHMM
            const dateStr = cols[acqDateIdx];
            let timeStr = cols[acqTimeIdx]; // e.g. "0930"
            if (timeStr.length === 4) {
                timeStr = `${timeStr.substring(0, 2)}:${timeStr.substring(2, 4)}:00Z`;
            } else {
                timeStr = '00:00:00Z';
            }
            const dateObj = new Date(`${dateStr}T${timeStr}`);
            if (!isNaN(dateObj.getTime())) {
                detectedAt = dateObj.toISOString();
            }
        }

        fires.push({
            latitude: parseFloat(cols[latIdx]),
            longitude: parseFloat(cols[lonIdx]),
            confidence: conf,
            detectedAt
        });
    }

    return fires;
}
