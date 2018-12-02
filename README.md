# CSGO_Match_Data_CSV_Generator

Uses node.js module [HLTV](https://github.com/gigobyte/HLTV) to gather professional CS:GO match results and reformat it into a CSV file that can be used in data mining.

## Usage
I recommend installing [NVM](https://github.com/creationix/nvm) and using it to install node and npm.

Run `node index` in the command line to generate csv files. 

If you get `FATAL ERROR: CALL_AND_RETRY_LAST Allocation failed - process out of memory` or a similar error during execution, try using the `--max_old_space_size` flag like so: `node --max_old_space_size=2048 index`.

If the script fails for a different reason, try updating the hltv module with `npm update hltv`.
