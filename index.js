/* 
 * Thomas Giulianelli
 *
 * Uses unofficial HLTV API to get past match results between top teams and reformats the data into a CSV file 
 * that will be used for data mining applications.
 */
 
const { HLTV } = require('hltv')
var fs = require("fs");

HLTV.getResults({pages: 1}).then((res) => {
	writeCSV(res);
})

/* Fill csv file with relevant data */
writeCSV = function(stats){
	var csvWriter = fs.createWriteStream('output/CSGO_Matches.csv', {flags: 'w'})
	for (var i = 0; i < stats.length; i++) {
		var matchData = stats[i];
		if (matchData.stars >= 2) {
			//console.log(matchData.team1.name + " " + matchData.result + " " + matchData.team2.name);
			csvWriter.write(matchData.team1.name + "," + matchData.result + "," + matchData.team2.name + "\n");
		}
	}
	csvWriter.end(); //close file
}

console.log('program end');
