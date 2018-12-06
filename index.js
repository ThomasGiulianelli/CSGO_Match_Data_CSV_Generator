/* 
 * Thomas Giulianelli
 *
 * Uses unofficial HLTV API to get past match results between top teams and reformats the data into a CSV file 
 * that will be used for data mining applications.
 */
 
const { HLTV } = require('hltv')
var fs = require("fs");

var teamRankings; //will hold top teams and their ranking info
var teamStats = {}; //will hold top teams and their map winrates

console.log("Fetching team rankings...\n");

/* Gets the top 30 teams */
HLTV.getTeamRanking().then(res => {
	teamRankings = res;
	
	var teamIDs = [];
	var gettingResults = false;
	
	/* Loop through array of top teams */
	for (let i = 0; i < teamRankings.length; i++) {  //Note: its important to declare i using keyword 'let' so that its correct value is accessible inside the getTeamStats promise.
		
		teamIDs[i] = teamRankings[i].team.id;
		
		HLTV.getTeamStats({id: teamIDs[i]}).then(res => {
			populateTeamStats(res,teamIDs[i]);
			
			/* Only run this block if no other callback has run it yet. */
			if (!gettingResults) {
				gettingResults = true;
				console.log("\nFetching match results...\n");
		
				/* Gets past match results. 
				 * Num pages should be at least 15 to allow the getTeamStats promises to complete.*/
				HLTV.getResults({pages: 500}).then((res) => {
					writeCSV(res);
				})
			}
		})
	}
})


/* Adds a key: value pair to teamStats object */
populateTeamStats = function(res,teamID) {
  
  /* Object to hold winrate on each map */
  var mapWinRates = { 
  	'mrg': null, 
  	'trn': null,
  	'cbl': null,
  	'ovp': null,
  	'inf': null,
  	'cch': null,
  	'nuke': null,
  	'd2': null 
  };
  try { mapWinRates['mrg'] = res.mapStats.mrg.winRate; }
  catch(err) { mapWinRates['mrg'] = ""; console.log("Team " + teamID + " mrg stat unavailable"); }
  try { mapWinRates['trn'] = res.mapStats.trn.winRate; }
  catch(err) { mapWinRates['trn'] = ""; console.log("Team " + teamID + " trn stat unavailable"); }
  try { mapWinRates['cbl'] = res.mapStats.cbl.winRate; }
  catch(err) { mapWinRates['cbl'] = ""; console.log("Team " + teamID + " cbl stat unavailable"); }
  try { mapWinRates['ovp'] = res.mapStats.ovp.winRate; }
  catch(err) { mapWinRates['ovp'] = ""; console.log("Team " + teamID + " ovp stat unavailable"); }
  try { mapWinRates['inf'] = res.mapStats.inf.winRate; }
  catch(err) { mapWinRates['inf'] = ""; console.log("Team " + teamID + " inf stat unavailable"); }
  try { mapWinRates['cch'] = res.mapStats.cch.winRate; }
  catch(err) { mapWinRates['cch'] = ""; console.log("Team " + teamID + " cch stat unavailable"); }
  try { mapWinRates['nuke'] = res.mapStats.nuke.winRate; }
  catch(err) { mapWinRates['nuke'] = ""; console.log("Team " + teamID + " nuke stat unavailable"); }
  try { mapWinRates['d2'] = res.mapStats.d2.winRate; }
  catch(err) { mapWinRates['d2'] = ""; console.log("Team " + teamID + " d2 stat unavailable"); }
   	
  /* Add team: mapWinRates pair to teamStats */
  teamStats[teamID] = mapWinRates;
}


/* Fill csv file with relevant data */
writeCSV = function(stats){
	console.log("\nCreating csv at output/CSGO_Matches_v2.csv\nCreating csv at output/CSGO_Matches_Binary_v2.csv");
	var csvWriter = fs.createWriteStream('output/CSGO_Matches_v2.csv', {flags: 'w'})
	var csvWriter2 = fs.createWriteStream('output/CSGO_Matches_Binary_v2.csv', {flags: 'w'}) //for binary classification
	csvWriter.write("Team,Team Score,Opponent,Opponent Score,Map,Map WinRate,Team Ranking (points),Opponent Ranking (points)"); //write csv header
	csvWriter2.write("Team,Team Score,Opponent,Opponent Score,Map,Map WinRate,Team Ranking (points),Opponent Ranking (points),Result"); //write csv header
	
	
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
			
			/* Exclude Best of 3 and Best of 5 scores. 16 is the minimum required score to win a Best of 1 */
			if (score1Int + score2Int >= 16) {
				/* determine if the team won or lost against their opponent */
				if (score1Int > score2Int) {
					var result = "win";
				}
				else var result = "loss";
				
				/* Get map on which match was played */
				var map = matchData.map;
				
				/* Get teams' ids */
				var team1_id = matchData.team1.id;
				var team2_id = matchData.team2.id;
				
				/* Get maps statistics from the team */
				var mapsData = teamStats[team1_id];
				//console.log("maps data: " + JSON.stringify(mapsData,null,4));
				
				/* Get winrate statistic for the relevant map */
				try { var winRate = teamStats[team1_id][map]; }
				catch(err) {var winRate = ""; console.log("failed to get winrate: team " + team1_id + ", map " + map);}
				
				/* Get the teams' rankings in points (1000pts = max ranking) */
				for (var j = 0; j < teamRankings.length; j++) {
					if (teamRankings[j].team.id == team1_id) {
						var teamRankingPoints = teamRankings[j].points;
					}
					if (teamRankings[j].team.id == team2_id) {
						var opponentRankingPoints = teamRankings[j].points;
					}
				}
				
				/* Append new record to files */
				csvWriter.write("\n" + matchData.team1.name + "," + score1 + "," + matchData.team2.name + "," + score2 +  
				"," + map + "," + winRate + "," + teamRankingPoints + "," + opponentRankingPoints);
				csvWriter2.write("\n" + matchData.team1.name + "," + score1 + "," + matchData.team2.name + "," + score2 +  
				"," + map + "," + winRate + "," + teamRankingPoints + "," + opponentRankingPoints + "," + result);
			}
		}
	}
	csvWriter.end(); //close file
	csvWriter2.end(); //close file
	console.log("Done!");
}
