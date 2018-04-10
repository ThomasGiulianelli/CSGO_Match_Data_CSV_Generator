/* 
 * Thomas Giulianelli
 *
 * Uses unofficial HLTV API to get past match results between top teams and reformats the data into a CSV file 
 * that will be used for data mining applications.
 */
 
const { HLTV } = require('hltv')
var fs = require("fs");

console.log('Fetching match results...');
HLTV.getResults({pages: 100}).then((res) => {
	writeCSV(res);
})

/* Fill csv file with relevant data */
writeCSV = function(stats){
	console.log('Creating csv at output/CSGO_Matches.csv');
	var csvWriter = fs.createWriteStream('output/CSGO_Matches.csv', {flags: 'w'})
	csvWriter.write("Team,Team Score,Opponent,Opponent Score"); //write csv header
	
	/* Loop through array of match results */
	for (var i = 0; i < stats.length; i++) {
		var matchData = stats[i];
		
		/* Only include matches where both teams are ranked in the top 20 in the world */
		if (matchData.stars >= 2) {
			/* Extract score for each team */			
			var result = matchData.result;
			var resultArray = result.split(" - ");
			var score1 = resultArray[0];
			var score2 = resultArray[1];
			
			/* Append new record to file */
			csvWriter.write("\n" + matchData.team1.name + "," + score1 + "," + matchData.team2.name + "," + score2);
		}
	}
	csvWriter.end(); //close file
	console.log('Done!');
}
