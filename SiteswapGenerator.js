/* constants */
var LEFT = 0, RIGHT = 1;

function clone(obj) {
  var newObj = (obj instanceof Array) ? [] : {};
  for (i in obj) {
    if (i == 'clone') continue;
    if (obj[i] && typeof obj[i] == "object") {
      newObj[i] = clone(obj[i]);
    } else newObj[i] = obj[i]
  } return newObj;
};

/* get all valid prop orbits for a number of beats and jugglers */
function getAllPropOrbits(numBeats,numJugglers) {

	function getOrbits(currentBeat,currentOrbit) {
		for (var beat = currentBeat; beat < numBeats; beat++) {
			for (var juggler = 0; juggler < numJugglers; juggler++) {
				
				var newOrbit = clone(currentOrbit);
				newOrbit.push({beat: beat, juggler: juggler, hand: LEFT});
				propOrbits.push(newOrbit);
				getOrbits(beat+1,newOrbit);
				
				newOrbit = clone(currentOrbit);
				newOrbit.push({beat: beat, juggler: juggler, hand: RIGHT});
				propOrbits.push(newOrbit);
				getOrbits(beat+1,newOrbit);
			}
		}
	}

	var propOrbits = [];

	getOrbits(0,[]);

	return propOrbits;

}

/* get the toss array from a set of orbits */
function getTossArrayFromOrbits(orbits,numBeats) {
	
	var tossArr = [];
	
	for (var prop = 0; prop < orbits.length; prop++) {
		for (var toss = 0; toss < orbits[prop].length; toss++) {
			
			/* find the next toss for the prop. used to determine how many beats the current toss is. */
			var nextTossIx = (toss == orbits[prop].length-1 ? 0 : toss+1);
			if (tossArr[orbits[prop][toss].beat] == undefined) {
				tossArr[orbits[prop][toss].beat] = [];
			}

			tossArr[orbits[prop][toss].beat].push({
				juggler: orbits[prop][toss].juggler,
				numBeats: (nextTossIx == 0 ? numBeats - orbits[prop][toss].beat + orbits[prop][nextTossIx].beat : orbits[prop][nextTossIx].beat - orbits[prop][toss].beat),
				hand: orbits[prop][toss].hand,
				crossing: (orbits[prop][toss].hand != orbits[prop][nextTossIx].hand)
			});

		}
	}

	/* make sure all beats are accounted for. empty beats need a 0 */
	for (var i = 0; i < numBeats; i++) {
		if (tossArr[i] == undefined) {
			tossArr[i] = {juggler: 0, hand: undefined, numBeats: 0, crossing: false};
		}
	}

	return tossArr;
}

/* get the siteswap for a given toss array */
/* currently only works for 1 juggler */
function getSiteswapFromTossArray(tossArr,showHand) {

	function getSiteswapFromToss(toss) {
		var s = toss.numBeats;
		if ((toss.numBeats % 2 == 1 && !toss.crossing) || (toss.numBeats % 2 == 0 && toss.crossing))
			s += 'x';
		return s;
	}

	var siteswap = "";

	/* each beat in toss array creates a new siteswap */
	for (var beat = 0; beat < tossArr.length; beat++) {
		
		var leftSiteswap = "";
		var rightSiteswap = "";
		var leftCt = 0;
		var rightCt = 0;
		for (var toss = 0; toss < tossArr[beat].length; toss++) {
			var s = getSiteswapFromToss(tossArr[beat][toss]);
			var hand = tossArr[beat][toss].hand != undefined ? tossArr[beat][toss].hand : beat % 2;
			if (hand == LEFT) {
				leftSiteswap += s;
				leftCt++;
			} else {
				rightSiteswap += s;
				rightCt++;
			}
		}

		if (leftCt > 1) {
			leftSiteswap = "[" + leftSiteswap + "]";
		}
		if (rightCt > 1) {
			rightSiteswap = "[" + rightSiteswap + "]";
		}

		if (leftCt > 0 && rightCt > 0) {
			siteswap += ("(" + leftSiteswap + "," + rightSiteswap + ")");
		} 
		else if (leftCt > 0) {
			if (showHand) {
				leftSiteswap = "L" + leftSiteswap;
			}
			siteswap += leftSiteswap;
		}
		else if (rightCt > 0) {
			if (showHand) {
				rightSiteswap = "R" + rightSiteswap;
			}
			siteswap += rightSiteswap;
		} 
		else {
			siteswap += "0";
		}

	}

	return siteswap;

}

/* generate all valid siteswaps for a number of beats and props. only works for 1 juggler */
function generateSiteswaps(numBeats, minProps, maxProps, limit) {

	var numJugglers = 1;

	/* get all valid prop orbits */
	allPropOrbits = getAllPropOrbits(numBeats,numJugglers);	

	var siteswaps = [];
	var it = 0; // keeps track of how many siteswaps we've found

	function getAllSiteswaps(currentOrbits,i,minProps,maxProps) {
		
		it++;

		/* put a limit on the number of iterations we can run */
		if (it < limit || limit == undefined) {

			/* ensure no even beats in right hand or odd beats in left hand */
			var alternating = true;
			for (var j = 0; j < allPropOrbits[i].length; j++) {
				if ( (allPropOrbits[i][j].beat % 2 == 0 && allPropOrbits[i][j].hand == LEFT) || (allPropOrbits[i][j].beat % 2 == 1 && allPropOrbits[i][j].hand == RIGHT) ) {
					alternating = false;
				}
			}

			var multiplex = false;
			for (var j = 0; j < currentOrbits.length; j++) {
				if(multiplexOrbits(allPropOrbits[currentOrbits[j]],allPropOrbits[i])) {
					multiplex = true;
					break;
				}
			}

			var sync = false;
			for (var j = 0; j < currentOrbits.length; j++) {
				if(syncOrbits(allPropOrbits[currentOrbits[j]],allPropOrbits[i])) {
					sync = true;
					break;
				}			
			}			
			
			if (!multiplex && !sync && alternating) {
				currentOrbits.push(i);
				if (currentOrbits.length >= minProps && currentOrbits.length <= maxProps) {
					siteswaps.push(findMinPattern(getSiteswapFromTossArray(getTossArrayFromOrbits(currentOrbits.map(function (ix) { return allPropOrbits[ix]; }), numBeats),false)));
				} 
				if (currentOrbits.length < maxProps) {
					for (var j = i; j < allPropOrbits.length; j++) {					
						getAllSiteswaps(clone(currentOrbits),j,minProps,maxProps);
					}
				}
			}
		}
	}

	for (var i = 0; i < allPropOrbits.length; i++) {
		getAllSiteswaps([],i,minProps,maxProps);
	}

	return siteswaps;	

}

function multiplexOrbits(o1,o2) {
	for(var i = 0; i < o1.length; i++) {
		for (var j = 0; j < o2.length; j++) {
			if (o1[i].beat == o2[j].beat && o1[i].hand == o2[j].hand && o1[i].juggler == o2[j].juggler) {
				return true;
			}
		}
	}
	return false;
}

function syncOrbits(o1,o2) {
	for(var i = 0; i < o1.length; i++) {
		for (var j = 0; j < o2.length; j++) {
			if (o1[i].beat == o2[j].beat && o1[i].hand != o2[j].hand && o1[i].juggler == o2[j].juggler) {
				return true;
			}
		}
	}
	return false;
} 

function findMinPattern(str) {
	for (var i = 1; i <= str.length/2; i++) {
		if (str.length % i == 0) {
			var match = true;
			j = 0;
			while (match && j+i+i <= str.length) {
				if (str.substring(j,j+i) != str.substring(j+i,j+i+i)) {
					match = false;
				}
				j = j+i;
			}
			if (match) {
				return str.substring(0,i);
			}
		}
	}
	return str;
}

/* run on load */
var s = generateSiteswaps(6,3,6);
var fileData = "";
for (var i = 0; i < s.length; i++) {
	fileData += (s[i] + "\n");
}

var fs = require('fs');
fs.writeFile("siteswaps.csv", fileData, function(err) {
    if(err) {
        console.log(err);
    } else {
        console.log("Success");
    }
}); 