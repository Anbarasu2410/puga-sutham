async function main() {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=9.851&longitude=78.219&current=wind_speed_10m,wind_direction_10m`;
    const response = await fetch(url);
    const data = await response.json();
    console.log(data);
}
main();
