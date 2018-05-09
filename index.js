/* 
 * Thomas Giulianelli
 *
 * Uses unofficial HLTV API to get past match results between top teams and reformats the data into a CSV file 
 * that will be used for data mining applications.
 */
 
const { HLTV } = require('hltv')
var fs = require("fs");

var teamRankings; //will hold top teams and their ranking info
var teamStats = {}; //will hold top teams and their map winrates BROKEN - I can't figure out how to fill it with unique teams (only recieves 30 instances of the same team right now)

console.log("Fetching team rankings...");

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
async function pause() {
	console.log("before sleep");
	await sleep(3000); //pause loop execution to allow getTeamStats to finish
	console.log("after sleep");
}

/* Gets the top 30 teams */
HLTV.getTeamRanking().then(res => {
	teamRankings = res;
	//console.log(teamRankings);
	
	/* Loop through array of top teams except the last team */
	for (var i = 0; i < teamRankings.length - 1; i++) {
		var teamID = teamRankings[i].team.id;
		HLTV.getTeamStats({id: teamID}).then(res => {
			populateTeamStats(res,teamID);
		})
		//pause(); //Did not work as intended
	}
	
	/* Get the last team from teamRankings array */
	var teamID = teamRankings[teamRankings.length - 1].team.id;
	HLTV.getTeamStats({id: teamID}).then(res => {
		populateTeamStats(res,teamID);
		
		console.log("Fetching match results...");
		
		/* Gets past match results. 
		 * Num pages should be at least 15 to allow the callbacks in the above for loop to complete. */
		HLTV.getResults({pages: 500}).then((res) => {
			writeCSV(res);
		})
	})
})

/* Adds a key: value pair to teamStats object
 * Bug: teamID changes thanks to above for loop faster than it can be used in this function, so it's practically useless */
populateTeamStats = function(res,teamID) {
  /* Object to hold winrate on each map */
  var mapWinRates = { 
  	'mrg': null, 
  	'trn': null,
  	'cbl': null,
  	'ovp': null,
  	'inf': null,
  	'cch': null,
  	'nuke': null 
  };
  try { mapWinRates['mrg'] = res.mapStats.mrg.winRate; }
  catch(err) { console.log("mrg stat unavailable"); }
  try { mapWinRates['trn'] = res.mapStats.trn.winRate; }
  catch(err) { console.log("trn stat unavailable"); }
  try { mapWinRates['cbl'] = res.mapStats.cbl.winRate; }
  catch(err) { console.log("cbl stat unavailable"); }
  try { mapWinRates['ovp'] = res.mapStats.ovp.winRate; }
  catch(err) { console.log("ovp stat unavailable"); }
  try { mapWinRates['inf'] = res.mapStats.inf.winRate; }
  catch(err) { console.log("inf stat unavailable"); }
  try { mapWinRates['cch'] = res.mapStats.cch.winRate; }
  catch(err) { console.log("cch stat unavailable"); }
  try { mapWinRates['nuke'] = res.mapStats.nuke.winRate; }
  catch(err) { console.log("nuke stat unavailable"); }
   	
  /* Add team: mapWinRates pair to teamStats */
  teamStats[teamID] = mapWinRates;
  console.log("team " + teamID + " " + teamStats[teamID]['nuke']);
}


/* Fill csv file with relevant data */
writeCSV = function(stats){
	console.log("Creating csv at output/CSGO_Matches.csv\nCreating csv at output/CSGO_Matches_Binary.csv");
	var csvWriter = fs.createWriteStream('output/CSGO_Matches.csv', {flags: 'w'})
	var csvWriter2 = fs.createWriteStream('output/CSGO_Matches_Binary.csv', {flags: 'w'}) //for binary classification
	csvWriter.write("Team,Team Score,Opponent,Opponent Score,Map,Team Ranking (points),Opponent Ranking (points)"); //write csv header
	csvWriter2.write("Team,Team Score,Opponent,Opponent Score,Map,Team Ranking (points),Opponent Ranking (points),Result"); //write csv header
	//TODO: add Map WinRate if the bug mentioned above is fixable
	
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
				
				//console.log("teamStats: "); console.log(teamStats);
				/* Get maps statistics from the team */
				//var mapsData = teamStats[team1_id];
				//console.log("maps data: " + mapsData);
				/* Get winrate statistic for the relevant map */
				//try { var winRate = teamStats[team1_id][map]; }
				//catch(err) {var winRate = ""; console.log("failed to get winrate");}
				
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
				"," + map + "," + teamRankingPoints + "," + opponentRankingPoints);
				csvWriter2.write("\n" + matchData.team1.name + "," + score1 + "," + matchData.team2.name + "," + score2 +  
				"," + map + "," + teamRankingPoints + "," + opponentRankingPoints + "," + result);
			}
		}
	}
	csvWriter.end(); //close file
	csvWriter2.end(); //close file
	console.log("Done!");
}
