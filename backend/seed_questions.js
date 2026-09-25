const fs=require("fs"); const mysql=require("mysql2");
const questions=JSON.parse(fs.readFileSync(__dirname+"/question_bank.json","utf8"));
const db=mysql.createConnection({host:"https://cyberquest-9ig4.onrender.com",user:"root",password:"k@rtik@#45",database:"cybershield"});
db.connect(err=>{if(err)throw err; const sql=`INSERT IGNORE INTO questions (question_text,option1,option2,option3,option4,correct_option,difficulty) VALUES ?`; const values=questions.map(q=>[q.question_text,q.option1,q.option2,q.option3,q.option4,q.correct_option,q.difficulty]); db.query(sql,[values],(e,r)=>{if(e)throw e; console.log(`Seed complete. Inserted/ignored: ${r.affectedRows}`); db.end();});});
