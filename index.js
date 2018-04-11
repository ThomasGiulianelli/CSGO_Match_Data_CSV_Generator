/* 
 * Thomas Giulianelli
 *
 * Uses unofficial HLTV API to get past match results between top teams and reformats the data into a CSV file 
 * that will be used for data mining applications.
 */
 
const { HLTV } = require('hltv')
var fs = require("fs");

console.log('Fetching match results...');
HLTV.getResults({pages: 150}).then((res) => {
	writeCSV(res);
})

/* Fill csv file with relevant data */
writeCSV = function(stats){
	console.log('Creating csv at output/CSGO_Matches.csv');
	var csvWriter = fs.createWriteStream('output/CSGO_Matches.csv', {flags: 'w'})
	var csvWriter2 = fs.createWriteStream('output/CSGO_Matches_Binary.csv', {flags: 'w'}) //for binary classification
	csvWriter.write("Team,Team Score,Opponent,Opponent Score"); //write csv header
	csvWriter2.write("Team,Team Score,Opponent,Opponent Score,Map,Result"); //write csv header
	
	/* Loop through array of match results */
	for (var i = 0; i < stats.length; i++) {
		var matchData = stats[i];
		
		/* Only include matches where both teams are ranked in the top 20 in the world */
		if (matchData.stars >= 2) {
			/* Extract score for each team */			
			var scoreResult = matchData.result;
			var scoreResultArray = scoreResult.split(" - ");
			var score1 = scoreResultArray[0]; //team score
			var score2 = scoreResultArray[1]; //opponent score
			
			/* Convert scores to ints for comparison */
			score1Int = parseInt(score1);
			score2Int = parseInt(score2);
			
			/* Exclude Best of 3 and Best of 5 scores. 16 is the minimum required score to win a match */
			if (score1Int + score2Int >= 16) {
				/* determine if the team won or lost against their opponent */
				if (score1Int > score2Int) {
					var result = "win";
				}
				else var result = "loss";
				
				/* Append new record to file */
				csvWriter.write("\n" + matchData.team1.name + "," + score1 + "," + matchData.team2.name + "," + score2);
				csvWriter2.write("\n" + matchData.team1.name + "," + score1 + "," + matchData.team2.name + "," + score2 + "," + 
				matchData.map + "," + result);
			}
		}
	}
	csvWriter.end(); //close file
	csvWriter2.end(); //close file
	console.log('Done!');
}
