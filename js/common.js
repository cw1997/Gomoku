function writeText(element, text) {
	document.getElementById(element).innerHTML = text;
}
function buildJson(type, data) {
	return JSON.stringify({type:type,data:data});
}
function json2object(json) {
	return JSON.parse(json);
}