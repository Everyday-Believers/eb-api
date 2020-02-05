

const GLOBE_R = 6371e3; // earth's radius in meters
const METERS_TO_MILES = 0.000621371192;

function toRadians(deg){
	return deg * Math.PI / 180;
}

function sqr(a){
	return a * a;
}

module.exports = (lat1, lng1, lat2, lng2) => {
	const fai1 = toRadians(lat1);
	const fai2 = toRadians(lat2);
	const d_fai = toRadians(lat2 - lat1);
	const d_rmd = toRadians(lng2 - lng1);

	const a = sqr(Math.sin(d_fai / 2)) + Math.cos(fai1) * Math.cos(fai2) * sqr(Math.sin(d_rmd / 2));
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

	return GLOBE_R * c * METERS_TO_MILES; // miles
};
