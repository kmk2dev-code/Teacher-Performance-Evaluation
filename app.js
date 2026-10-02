const KEY="school_performance_v3";
const $=id=>document.getElementById(id);
let db=loadDB(), editingTeacher=null, editingAssessment=null, currentForm=null;
function num(v,min=0,max=Infinity){const n=Number(v);return Number.isFinite(n)?Math.min(max,Math.max(min,n)):min}
function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]))}
function saveDB(){localStorage.setItem(KEY,JSON.stringify(db))}
function formatBackupTime(v){if(!v)return "ยังไม่เคยสำรองข้อมูล";const d=new Date(v);return Number.isNaN(d.getTime())?"ยังไม่เคยสำรองข้อมูล":d.toLocaleString("th-TH",{dateStyle:"medium",timeStyle:"short"})}
function updateBackupStatus(){const s=db.settings||{};$("offlineStatus").textContent="โหมดออฟไลน์ • ข้อมูลอยู่ในเครื่องนี้";$("backupStatus").textContent="สำรองล่าสุด: "+formatBackupTime(s.lastBackupAt)}
function toast(msg){const x=$("toast");if(!x)return;x.textContent=msg;x.style.display="block";clearTimeout(window.__toast);window.__toast=setTimeout(()=>x.style.display="none",1800)}
function updateHeader(){const s=db.settings||{};$("schoolTitle").textContent=[s.school,s.agency,s.year?("ปีการศึกษา "+s.year):""].filter(Boolean).join(" • ")||"ตั้งค่าข้อมูลโรงเรียนในเมนูตั้งค่า"}
function switchView(view){document.querySelectorAll(".view").forEach(x=>x.classList.toggle("active",x.id===view));document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x.dataset.view===view));if(view==="dashboard")renderDashboard();if(view==="teachers")renderTeachers();if(view==="assessment")prepareAssessment();if(view==="records")renderRecords()}
function loadDB(){try{const x=JSON.parse(localStorage.getItem(KEY)||localStorage.getItem("school_performance_v2")||"null")||{settings:{school:"",agency:"",year:"2569",admin:""},teachers:[],assessments:[]};x.schemaVersion=3;x.settings={school:"",agency:"",year:"2569",admin:"",lastBackupAt:"",...(x.settings||{})};x.teachers=(x.teachers||[]).map(t=>{let rank=t.rank||"ไม่มีวิทยฐานะ",position=t.position||"ครู";if(["ครูชำนาญการ","ครูชำนาญการพิเศษ","ครูเชี่ยวชาญ","ครูเชี่ยวชาญพิเศษ"].includes(position)){rank=position;position="ครู"}return {...t,position,rank}});x.assessments=x.assessments||[];return x}catch{return {schemaVersion:3,settings:{school:"",agency:"",year:"2569",admin:""},teachers:[],assessments:[]}}}
function buildScoreRows(){
 $("assessmentC1").innerHTML=currentForm.indicators.map((x,i)=>'<tr><td>'+esc(x)+'</td><td><input class="score-input c1s" data-i="'+i+'" type="number" min="1" max="4" value="1"></td><td><input class="score-input c1b" data-i="'+i+'" type="number" min="1" max="4" value="1"></td></tr>').join("");
 $("assessmentChallenge").innerHTML=["1. วิธีดำเนินการ (20 คะแนน)","2.1 เชิงปริมาณ (10 คะแนน)","2.2 เชิงคุณภาพ (10 คะแนน)"].map((x,i)=>'<tr><td>'+esc(x)+'</td><td><input class="score-input chs" data-i="'+i+'" type="number" min="1" max="4" value="1"></td><td><input class="score-input chb" data-i="'+i+'" type="number" min="1" max="4" value="1"></td></tr>').join("");
 $("assessmentC3").innerHTML=C3.map((x,i)=>'<tr><td>'+esc(x)+'</td><td><input class="score-input c3s" data-i="'+i+'" type="number" min="1" max="4" value="1"></td><td><input class="score-input c3b" data-i="'+i+'" type="number" min="1" max="4" value="1"></td></tr>').join("");
 renderFormInfo();
}
const C3=[
"ยึดมั่นในสถาบันหลักของประเทศ อันได้แก่ ชาติ ศาสนา พระมหากษัตริย์ และการปกครองระบบประชาธิปไตยอันมีพระมหากษัตริย์ทรงเป็นประมุข",
"มีความซื่อสัตย์ สุจริต มีจิตสำนึกที่ดี มีความรับผิดชอบต่อหน้าที่และต่อผู้เกี่ยวข้อง",
"มีความกล้า คิด กล้าตัดสินใจ กล้าแสดงออก และกระทำในสิ่งที่ถูกต้อง ชอบธรรม",
"มีจิตอาสา จิตสาธารณะ มุ่งประโยชน์ส่วนรวม โดยไม่คำนึงถึงประโยชน์ส่วนตนหรือพวกพ้อง",
"มุ่งผลสัมฤทธิ์ของงาน มุ่งมั่นในการปฏิบัติงานอย่างเต็มกำลังความสามารถ โดยคำนึงถึงคุณภาพการศึกษาเป็นสำคัญ",
"ปฏิบัติหน้าที่อย่างเป็นธรรมและไม่เลือกปฏิบัติ",
"ดำรงตนเป็นแบบอย่างที่ดีและรักษาภาพลักษณ์ของข้าราชการครูและบุคลากรทางการศึกษา",
"เคารพศักดิ์ศรีความเป็นมนุษย์ คำนึงถึงสิทธิเด็ก และยอมรับความแตกต่างของบุคคล",
"ยึดถือและปฏิบัติตามจรรยาบรรณของวิชาชีพ","มีวินัยและการรักษาวินัย"];
const STANDARD_14=[
"1.1 นำผลการวิเคราะห์หลักสูตร มาจัดทำรายวิชาและหน่วยการเรียนรู้","1.2 ปฏิบัติการสอนโดยออกแบบการจัดการเรียนรู้","1.3 จัดกิจกรรมการเรียนรู้","1.4 เลือกและใช้สื่อ เทคโนโลยี และแหล่งเรียนรู้","1.5 วัดและประเมินผลการเรียนรู้","1.6 จัดบรรยากาศที่ส่งเสริมและพัฒนาผู้เรียน","1.7 อบรมบ่มนิสัยให้ผู้เรียนมีคุณธรรม จริยธรรม","2.1 จัดทำข้อมูลสารสนเทศของผู้เรียนและรายวิชา","2.2 ดำเนินการตามระบบดูแลช่วยเหลือผู้เรียน","2.3 ร่วมปฏิบัติงานทางวิชาการ และงานอื่น ๆ ของสถานศึกษา","2.4 ประสานความร่วมมือกับผู้ปกครอง หรือผู้เกี่ยวข้อง","3.1 พัฒนาตนเองอย่างเป็นระบบและต่อเนื่อง","3.2 มีส่วนร่วมในการแลกเปลี่ยนเรียนรู้ทางวิชาชีพ","3.3 นำความรู้ความสามารถ ทักษะ ที่ได้จากการพัฒนาตนเองและวิชาชีพมาใช้"];
const STANDARD_15=[
"1.1 สร้างและหรือพัฒนาหลักสูตร","1.2 ออกแบบการจัดการเรียนรู้","1.3 จัดกิจกรรมการเรียนรู้","1.4 สร้างและหรือพัฒนาสื่อ นวัตกรรม เทคโนโลยี และแหล่งเรียนรู้","1.5 วัดและประเมินผลการเรียนรู้","1.6 ศึกษา วิเคราะห์ และสังเคราะห์ เพื่อแก้ปัญหาหรือพัฒนาการเรียนรู้","1.7 จัดบรรยากาศที่ส่งเสริมและพัฒนาผู้เรียน","1.8 อบรมและพัฒนาคุณลักษณะที่ดีของผู้เรียน","2.1 จัดทำข้อมูลสารสนเทศของผู้เรียนและรายวิชา","2.2 ดำเนินการตามระบบดูแลช่วยเหลือผู้เรียน","2.3 ปฏิบัติงานวิชาการและงานอื่น ๆ ของสถานศึกษา","2.4 ประสานความร่วมมือกับผู้ปกครอง ภาคีเครือข่าย และหรือสถานประกอบการ","3.1 พัฒนาตนเองอย่างเป็นระบบและต่อเนื่อง","3.2 มีส่วนร่วมและเป็นผู้นำในการแลกเปลี่ยนเรียนรู้ทางวิชาชีพ","3.3 นำความรู้ ความสามารถ ทักษะ ที่ได้จากการพัฒนาตนเองและวิชาชีพมาใช้ในการพัฒนาการจัดการเรียนรู้"];
const FORMS={
 assistant:{code:"TEACHER_ASSISTANT",rank:"ไม่มีวิทยฐานะ",label:"ครูผู้ช่วย",sourceForm:"1.-แบบประเมินผลการปฏิบัติงาน-ครูผู้ช่วย",indicators:STANDARD_14,hasChallenge:false,c2RawMax:10,c2Weight:2},
 none:{code:"TEACHER_NONE",rank:"ไม่มีวิทยฐานะ",label:"ครู ยังไม่มีวิทยฐานะ",sourceForm:"2.-แบบประเมินผลการปฏิบัติงาน-ครู-ยังไม่มีวิทยฐานะ",indicators:STANDARD_15,hasChallenge:true,c2RawMax:10,c2Weight:2},
 ck:{code:"TEACHER_CK",rank:"ครูชำนาญการ",label:"ครู วิทยฐานะครูชำนาญการ",sourceForm:"3.-แบบประเมินผลการปฏิบัติงาน-ครู-วิทยฐานะครูชำนาญการ",indicators:STANDARD_15,hasChallenge:true,c2RawMax:10,c2Weight:2},
 ckp:{code:"TEACHER_CKP",rank:"ครูชำนาญการพิเศษ",label:"ครู วิทยฐานะครูชำนาญการพิเศษ",sourceForm:"4.-แบบประเมินผลการปฏิบัติงาน-ครู-วิทยฐานะครูชำนาญการพิเศษ",indicators:STANDARD_15,hasChallenge:true,c2RawMax:30,c2Weight:6},
 ce:{code:"TEACHER_CE",rank:"ครูเชี่ยวชาญ",label:"ครู วิทยฐานะครูเชี่ยวชาญ",sourceForm:"5.-แบบประเมินผลการปฏิบัติงาน-ครู-วิทยฐานะครูเชี่ยวชาญ",indicators:STANDARD_15,hasChallenge:true,c2RawMax:30,c2Weight:6},
 cep:{code:"TEACHER_CEP",rank:"ครูเชี่ยวชาญพิเศษ",label:"ครู วิทยฐานะครูเชี่ยวชาญพิเศษ",sourceForm:"6.-แบบประเมินผลการปฏิบัติงาน-ครู-วิทยฐานะครูเชี่ยวชาญพิเศษ",indicators:STANDARD_15,hasChallenge:true,c2RawMax:30,c2Weight:6}
};
function formForTeacher(t){if(t?.position==="ครูผู้ช่วย")return FORMS.assistant;switch(t?.rank){case "ครูชำนาญการ":return FORMS.ck;case "ครูชำนาญการพิเศษ":return FORMS.ckp;case "ครูเชี่ยวชาญ":return FORMS.ce;case "ครูเชี่ยวชาญพิเศษ":return FORMS.cep;default:return FORMS.none}}
function renderFormInfo(){
 const f=currentForm;
 $("formProfile").textContent=f.label;$("formSource").textContent=f.sourceForm;
 $("assessmentC1Title").textContent=f.hasChallenge?"ตอนที่ 1 — ระดับความสำเร็จในการพัฒนางานตามมาตรฐานตำแหน่ง (60 คะแนน)":"องค์ประกอบที่ 1 — การประเมินประสิทธิภาพและประสิทธิผลการปฏิบัติงานตามมาตรฐานตำแหน่ง (80 คะแนน)";
 $("assessmentC1Note").textContent=f.hasChallenge?"15 ตัวชี้วัด ระดับ 1–4 รวมฐาน 60 คะแนน":"14 ตัวชี้วัด ระดับ 1–4 รวมฐาน 56 คะแนน แล้วแปลงเป็น 80 คะแนนตามแบบครูผู้ช่วย";
 $("challengeCard").style.display=f.hasChallenge?"block":"none";$("summaryPart1").children[0].textContent=f.hasChallenge?"ตอนที่ 1 ระดับความสำเร็จในการพัฒนางานตามมาตรฐานตำแหน่ง":"องค์ประกอบที่ 1 การประเมินประสิทธิภาพและประสิทธิผลการปฏิบัติงานตามมาตรฐานตำแหน่ง";$("summaryPart1").children[1].textContent=f.hasChallenge?"60.00":"80.00";$("summaryPart2").style.display=f.hasChallenge?"table-row":"none";
 $("c2WeightNote").textContent=f.c2RawMax===30?"ระดับ 1–5 × ค่าน้ำหนัก 6 = ฐานดิบ 30 คะแนน แล้วแปลงเป็น 10 คะแนน":"ระดับ 1–5 × ค่าน้ำหนัก 2 = 10 คะแนน";
}
function fillFullScore(kind,target,checked=true){const map={c1:[".c1s",".c1b",4],challenge:[".chs",".chb",4],c2:["#assessmentC2S","#assessmentC2B",5],c3:[".c3s",".c3b",4]};const cfg=map[kind];if(!cfg)return;const sel=target==="self"?cfg[0]:target==="boss"?cfg[1]:null;if(!sel)return;document.querySelectorAll(sel).forEach(x=>{x.value=checked?cfg[2]:1;x.dispatchEvent(new Event("input",{bubbles:true}))});totalsRender();toast(checked?(target==="self"?"กำหนดคะแนนเต็มให้การประเมินตนเองแล้ว":"กำหนดคะแนนเต็มให้ผู้บังคับบัญชาแล้ว"):(target==="self"?"รีเซ็ตคะแนนตนเองเป็นค่าเริ่มต้นแล้ว":"รีเซ็ตคะแนนผู้บังคับบัญชาเป็นค่าเริ่มต้นแล้ว"))}
function readLevels(sel,min=1,max=4){return [...document.querySelectorAll(sel)].map(x=>num(x.value,min,max))}
function challengeScore(v){return (v[0]||0)*5+(v[1]||0)*2.5+(v[2]||0)*2.5}
function totals(){
 const s1=readLevels(".c1s"),b1=readLevels(".c1b"),cs=readLevels(".chs"),cb=readLevels(".chb"),s3=readLevels(".c3s"),b3=readLevels(".c3b"),c2s=num($("assessmentC2S").value,1,5),c2b=num($("assessmentC2B").value,1,5);
 const raw1s=s1.reduce((a,b)=>a+b,0),raw1b=b1.reduce((a,b)=>a+b,0);
 const part1s=currentForm.hasChallenge?raw1s:raw1s*80/56,part1b=currentForm.hasChallenge?raw1b:raw1b*80/56;
 const part2s=currentForm.hasChallenge?challengeScore(cs)*0.5:0,part2b=currentForm.hasChallenge?challengeScore(cb)*0.5:0;
 const c1s=Math.min(80,part1s+part2s),c1b=Math.min(80,part1b+part2b);
 const c2RawS=c2s*currentForm.c2Weight,c2RawB=c2b*currentForm.c2Weight,c2sFinal=c2RawS*10/currentForm.c2RawMax,c2bFinal=c2RawB*10/currentForm.c2RawMax;
 const raw3s=s3.reduce((a,b)=>a+b,0),raw3b=b3.reduce((a,b)=>a+b,0),c3s=raw3s/4,c3b=raw3b/4;
 return {raw1s,raw1b,part1s,part1b,part2s,part2b,c1s,c1b,c2RawS,c2RawB,c2s:c2sFinal,c2b:c2bFinal,raw3s,raw3b,c3s,c3b,self:c1s+c2sFinal+c3s,boss:c1b+c2bFinal+c3b};
}
function prepareAssessment(){
 const opts=db.teachers.map(t=>'<option value="'+esc(t.id)+'">'+esc(t.name)+" — "+esc(t.position)+" — "+esc(t.rank||"ไม่มีวิทยฐานะ")+'</option>').join("");
 $("assTeacher").innerHTML=opts||'<option value="">ยังไม่มีรายชื่อครู</option>';
 if(!editingAssessment&&$("assTeacher").value){const t=db.teachers.find(x=>x.id===$("assTeacher").value);if(t)currentForm=formForTeacher(t)}
 buildScoreRows();
 if(!editingAssessment)$("assDate").value=new Date().toISOString().slice(0,10);
}
function resetScores(){document.querySelectorAll("#assessment input[type=number]").forEach(x=>x.value="1");document.querySelectorAll(".full-score").forEach(x=>x.checked=false);editingAssessment=null;totalsRender();toast("รีเซ็ตคะแนนทั้งหมดเป็นระดับ 1 แล้ว")}
function totalsRender(){const t=totals();$("livePart1S").textContent=t.part1s.toFixed(2);$("livePart1B").textContent=t.part1b.toFixed(2);$("livePart2S").textContent=t.part2s.toFixed(2);$("livePart2B").textContent=t.part2b.toFixed(2);$("liveC1S").textContent=t.c1s.toFixed(2);$("liveC1B").textContent=t.c1b.toFixed(2);$("liveC2S").textContent=t.c2s.toFixed(2);$("liveC2B").textContent=t.c2b.toFixed(2);$("liveC3S").textContent=t.c3s.toFixed(2);$("liveC3B").textContent=t.c3b.toFixed(2);$("liveTotalS").textContent=t.self.toFixed(2);$("liveTotalB").textContent=t.boss.toFixed(2)}
function saveAssessment(){
 const teacher=db.teachers.find(t=>t.id===$("assTeacher").value);if(!teacher){toast("กรุณาเพิ่มรายชื่อครูก่อน");return}
 if(!$("assEvaluator").value.trim()){toast("กรุณาระบุผู้ประเมิน");$("assEvaluator").focus();return}
 if(!$("assDate").value){toast("กรุณาระบุวันที่ประเมิน");$("assDate").focus();return}
 currentForm=formForTeacher(teacher);const t=totals();
 const rec={id:editingAssessment?.id||crypto.randomUUID(),schemaVersion:3,formCode:currentForm.code,formLabel:currentForm.label,teacherId:teacher.id,teacherName:teacher.name,position:teacher.position,rank:teacher.rank||"ไม่มีวิทยฐานะ",round:$("assRound").value,evaluator:$("assEvaluator").value,date:$("assDate").value||new Date().toISOString().slice(0,10),scores:{c1s:readLevels(".c1s"),c1b:readLevels(".c1b"),challengeS:readLevels(".chs"),challengeB:readLevels(".chb"),c2s:num($("assessmentC2S").value,1,5),c2b:num($("assessmentC2B").value,1,5),c3s:readLevels(".c3s"),c3b:readLevels(".c3b")},totals:t,savedAt:new Date().toISOString()};
 const idx=db.assessments.findIndex(x=>x.id===rec.id);if(idx>=0)db.assessments[idx]=rec;else db.assessments.push(rec);editingAssessment=null;saveDB();toast("บันทึกผลการประเมินแล้ว");switchView("records")
}
function renderTeachers(){
 const q=$("teacherSearch").value.toLowerCase();let arr=db.teachers.filter(t=>(t.id+" "+t.name+" "+t.position+" "+(t.rank||"")).toLowerCase().includes(q));
 $("teacherRows").innerHTML=arr.length?arr.map(t=>'<tr><td>'+esc(t.id)+'</td><td>'+esc(t.name)+'</td><td>'+esc(t.position)+'</td><td>'+esc(t.rank||"ไม่มีวิทยฐานะ")+'</td><td><button class="btn" data-edit-teacher="'+esc(t.id)+'">แก้ไข</button> <button class="btn danger" data-del-teacher="'+esc(t.id)+'">ลบ</button></td></tr>').join(""):'<tr><td colspan="5" class="empty">ยังไม่มีข้อมูลครู</td></tr>';
}
function saveTeacher(){
 const id=$("teacherId").value.trim(),name=$("teacherName").value.trim(),position=$("teacherPosition").value||"ครูผู้ช่วย",rank=$("teacherRank").value||"ไม่มีวิทยฐานะ";if(!id||!name){toast("กรุณากรอกรหัสและชื่อครู");return}
 const old=db.teachers.find(t=>t.id===id);if(old&&editingTeacher!==id){toast("รหัสครูซ้ำ");return}
 const t={id,name,position,rank};if(editingTeacher){const i=db.teachers.findIndex(x=>x.id===editingTeacher);db.teachers[i]=t}else db.teachers.push(t);editingTeacher=null;clearTeacher();saveDB();toast("บันทึกข้อมูลครูแล้ว")
}
function clearTeacher(){$("teacherId").value="";$("teacherName").value="";$("teacherPosition").value="ครูผู้ช่วย";$("teacherRank").value="ไม่มีวิทยฐานะ";editingTeacher=null}
function editTeacher(id){const t=db.teachers.find(x=>x.id===id);if(!t)return;$("teacherId").value=t.id;$("teacherName").value=t.name;$("teacherPosition").value=t.position||"ครูผู้ช่วย";$("teacherRank").value=t.rank||"ไม่มีวิทยฐานะ";editingTeacher=id;switchView("teachers")}
function deleteTeacher(id){if(db.assessments.some(x=>x.teacherId===id)){toast("ลบไม่ได้: ครูคนนี้มีผลประเมินอยู่");return}db.teachers=db.teachers.filter(x=>x.id!==id);saveDB();toast("ลบข้อมูลแล้ว")}
function renderRecords(){
 const q=$("recordSearch").value.toLowerCase(),r=$("recordRound").value;let arr=db.assessments.filter(x=>(x.teacherName+" "+x.position+" "+(x.rank||"")).toLowerCase().includes(q)&&(!r||x.round===r));
 $("recordRows").innerHTML=arr.length?arr.slice().reverse().map(x=>'<tr><td>'+esc(x.teacherName)+'</td><td>'+esc(x.formLabel||x.formCode||"")+'</td><td>ครั้งที่ '+x.round+'</td><td>'+x.totals.c1b.toFixed(2)+'</td><td>'+x.totals.c2b.toFixed(2)+'</td><td>'+x.totals.c3b.toFixed(2)+'</td><td><strong>'+x.totals.boss.toFixed(2)+'</strong></td><td>'+esc(x.date)+'</td><td><button class="btn" data-edit-assessment="'+x.id+'">แก้ไข</button> <button class="btn" data-print-assessment="'+x.id+'">พิมพ์</button> <button class="btn danger" data-del-assessment="'+x.id+'">ลบ</button></td></tr>').join(""):'<tr><td colspan="9" class="empty">ยังไม่มีผลการประเมิน</td></tr>';
}
function renderDashboard(){
 const arr=db.assessments,vals=arr.map(x=>x.totals.boss),avg=vals.length?vals.reduce((a,b)=>a+b,0)/vals.length:0,max=vals.length?Math.max(...vals):0;
 $("statTeachers").textContent=db.teachers.length;$("statAssess").textContent=arr.length;$("statAvg").textContent=avg.toFixed(2);$("statMax").textContent=max.toFixed(2);
 $("dashboardRows").innerHTML=arr.length?arr.slice().reverse().slice(0,15).map(x=>'<tr><td>'+esc(x.teacherName)+'</td><td>'+esc(x.position)+'</td><td>ครั้งที่ '+x.round+'</td><td>'+x.totals.boss.toFixed(2)+'</td><td>'+esc(x.date)+'</td></tr>').join(""):'<tr><td colspan="5" class="empty">ยังไม่มีข้อมูล</td></tr>';
}
function renderAll(){updateHeader();updateBackupStatus();renderTeachers();renderRecords();renderDashboard();prepareAssessment()}
function csv(rows){return "\ufeff"+rows.map(r=>r.map(v=>'"'+String(v??"").replace(/"/g,'""')+'"').join(",")).join("\n")}
function download(name,text,type="text/plain"){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)}
function printAssessment(id){
 const r=db.assessments.find(x=>x.id===id);if(!r)return;
 const t=r.totals;
 const f=Object.values(FORMS).find(x=>x.code===r.formCode)||formForTeacher(r);
 const partRows=f.hasChallenge
  ? '<tr><td>ตอนที่ 1 ระดับความสำเร็จในการพัฒนางานตามมาตรฐานตำแหน่ง</td><td>60.00</td><td>'+t.part1s.toFixed(2)+'</td><td>'+t.part1b.toFixed(2)+'</td></tr><tr><td>ตอนที่ 2 ระดับความสำเร็จในการพัฒนางานที่เสนอเป็นประเด็นท้าทายในการพัฒนาผลลัพธ์การเรียนรู้ของผู้เรียน</td><td>20.00</td><td>'+t.part2s.toFixed(2)+'</td><td>'+t.part2b.toFixed(2)+'</td></tr>'
  : '<tr><td>องค์ประกอบที่ 1 การประเมินประสิทธิภาพและประสิทธิผลการปฏิบัติงานตามมาตรฐานตำแหน่ง</td><td>80.00</td><td>'+t.c1s.toFixed(2)+'</td><td>'+t.c1b.toFixed(2)+'</td></tr>';
 const part1Total=f.hasChallenge?'<tr><th>รวมองค์ประกอบที่ 1</th><th>80.00</th><th>'+t.c1s.toFixed(2)+'</th><th>'+t.c1b.toFixed(2)+'</th></tr>':'';
 $("printView").innerHTML='<div class="card"><h1>สรุปผลการประเมินการปฏิบัติงาน</h1><p>'+esc(db.settings.school)+' '+esc(db.settings.agency)+' ปีการศึกษา '+esc(db.settings.year)+'</p><p>แบบประเมิน: <b>'+esc(r.formLabel||f.label)+'</b></p><hr><p>ผู้รับการประเมิน: <b>'+esc(r.teacherName)+'</b> &nbsp; ตำแหน่ง: '+esc(r.position)+' &nbsp; วิทยฐานะ: '+esc(r.rank||"ไม่มีวิทยฐานะ")+'</p><p>รอบการประเมิน: ครั้งที่ '+r.round+' &nbsp; ผู้ประเมิน: '+esc(r.evaluator)+' &nbsp; วันที่: '+esc(r.date)+'</p><table><thead><tr><th>รายการประเมิน</th><th>คะแนนเต็ม</th><th>คะแนนประเมินตนเอง</th><th>คะแนนประเมินของผู้บังคับบัญชา</th></tr></thead><tbody>'+partRows+part1Total+'<tr><td>องค์ประกอบที่ 2 การประเมินการมีส่วนร่วมในการพัฒนาการศึกษา</td><td>10.00</td><td>'+t.c2s.toFixed(2)+'</td><td>'+t.c2b.toFixed(2)+'</td></tr><tr><td>องค์ประกอบที่ 3 การประเมินการปฏิบัติตนในการรักษาวินัย คุณธรรม จริยธรรม และจรรยาบรรณวิชาชีพ</td><td>10.00</td><td>'+t.c3s.toFixed(2)+'</td><td>'+t.c3b.toFixed(2)+'</td></tr><tr><th>คะแนนรวม</th><th>100.00</th><th>'+t.self.toFixed(2)+'</th><th>'+t.boss.toFixed(2)+'</th></tr></tbody></table></div>';
 document.querySelectorAll(".view").forEach(x=>x.classList.remove("active"));$("printView").classList.add("active");$("printView").classList.add("print-view");window.print();setTimeout(()=>{$("printView").classList.remove("print-view");switchView("records")},500)
}
function editAssessment(id){
 const r=db.assessments.find(x=>x.id===id);if(!r)return;editingAssessment=r;const teacher=db.teachers.find(x=>x.id===r.teacherId);
 currentForm=Object.values(FORMS).find(f=>f.code===r.formCode)||formForTeacher(teacher);
 $("assTeacher").value=r.teacherId;$("assRound").value=r.round;$("assEvaluator").value=r.evaluator;$("assDate").value=r.date;buildScoreRows();
 (r.scores.c1s||[]).forEach((v,i)=>{const x=document.querySelectorAll(".c1s")[i];if(x)x.value=v});(r.scores.c1b||[]).forEach((v,i)=>{const x=document.querySelectorAll(".c1b")[i];if(x)x.value=v});
 (r.scores.challengeS||[]).forEach((v,i)=>{const x=document.querySelectorAll(".chs")[i];if(x)x.value=v});(r.scores.challengeB||[]).forEach((v,i)=>{const x=document.querySelectorAll(".chb")[i];if(x)x.value=v});
 $("assessmentC2S").value=r.scores.c2s||1;$("assessmentC2B").value=r.scores.c2b||1;
 (r.scores.c3s||[]).forEach((v,i)=>{const x=document.querySelectorAll(".c3s")[i];if(x)x.value=v});(r.scores.c3b||[]).forEach((v,i)=>{const x=document.querySelectorAll(".c3b")[i];if(x)x.value=v});
 totalsRender();switchView("assessment")
}
document.addEventListener("click",e=>{
 const t=e.target;
 if(t.matches(".tab"))switchView(t.dataset.view);
 if(t.id==="saveTeacher")saveTeacher();if(t.id==="clearTeacher")clearTeacher();if(t.id==="saveAssessment")saveAssessment();if(t.id==="resetScores")resetScores();if(t.id==="newAssessment")resetScores();
 if(t.id==="print")window.print();if(t.id==="backupBtn"){db.settings.lastBackupAt=new Date().toISOString();saveDB();updateBackupStatus();download("school-performance-backup.json",JSON.stringify(db,null,2),"application/json");toast("สร้างไฟล์สำรองแล้ว")}
 if(t.id==="restoreBtn")$("restoreFile").click();
 if(t.dataset.editTeacher)editTeacher(t.dataset.editTeacher);if(t.dataset.delTeacher&&confirm("ลบครูคนนี้หรือไม่?"))deleteTeacher(t.dataset.delTeacher);
 if(t.dataset.editAssessment)editAssessment(t.dataset.editAssessment);if(t.dataset.delAssessment&&confirm("ลบผลประเมินรายการนี้หรือไม่?")){db.assessments=db.assessments.filter(x=>x.id!==t.dataset.delAssessment);saveDB();toast("ลบผลประเมินแล้ว")};if(t.dataset.printAssessment)printAssessment(t.dataset.printAssessment);
 if(t.id==="exportTeachers"){download("teachers.csv",csv([["รหัส","ชื่อ","ตำแหน่ง","วิทยฐานะ"],...db.teachers.map(x=>[x.id,x.name,x.position,x.rank||"ไม่มีวิทยฐานะ"])]),"text/csv;charset=utf-8")}
 if(t.id==="exportRecords"){download("assessment-results.csv",csv([["รหัส","ชื่อ","ตำแหน่ง","วิทยฐานะ","รอบ","องค์ประกอบ 1","องค์ประกอบ 2","องค์ประกอบ 3","รวมตนเอง","รวมผู้บังคับบัญชา","วันที่"],...db.assessments.map(x=>[x.teacherId,x.teacherName,x.position,x.rank||"ไม่มีวิทยฐานะ",x.round,x.totals.c1b.toFixed(2),x.totals.c2b.toFixed(2),x.totals.c3b.toFixed(2),x.totals.self.toFixed(2),x.totals.boss.toFixed(2),x.date])]),"text/csv;charset=utf-8")}
 if(t.id==="saveSettings"){db.settings={school:$("setSchool").value.trim(),agency:$("setAgency").value.trim(),year:$("setYear").value.trim(),admin:$("setAdmin").value.trim(),lastBackupAt:db.settings.lastBackupAt||""};saveDB();updateHeader();updateBackupStatus();toast("บันทึกการตั้งค่าแล้ว")}
});
function refreshAssessmentPreview(){if(document.getElementById("assessment"))totalsRender()}
document.addEventListener("input",e=>{if(e.target.id==="teacherSearch")renderTeachers();if(e.target.id==="recordSearch"||e.target.id==="recordRound")renderRecords();if(e.target.closest("#assessment"))refreshAssessmentPreview()});
document.addEventListener("change",e=>{if(e.target.id==="assTeacher"){const t=db.teachers.find(x=>x.id===$("assTeacher").value);currentForm=formForTeacher(t);buildScoreRows();refreshAssessmentPreview();return}if(e.target.id==="recordRound"){renderRecords();return}if(e.target.closest("#assessment"))refreshAssessmentPreview()});

$("restoreFile").addEventListener("change",e=>{const f=e.target.files[0];if(!f)return;const rd=new FileReader();rd.onload=()=>{try{const x=JSON.parse(rd.result);if(!x.teachers||!x.assessments)throw Error();db=x;db.schemaVersion=3;db.settings={school:"",agency:"",year:"2569",admin:"",lastBackupAt:"",...(db.settings||{})};saveDB();updateHeader();updateBackupStatus();renderAll();toast("นำเข้าข้อมูลแล้ว")}catch{toast("ไฟล์สำรองไม่ถูกต้อง")}};rd.readAsText(f)});
function init(){currentForm=currentForm||FORMS.assistant;buildScoreRows();$("setSchool").value=db.settings.school;$("setAgency").value=db.settings.agency;$("setYear").value=db.settings.year;$("setAdmin").value=db.settings.admin;$("assDate").value=new Date().toISOString().slice(0,10);renderAll();totalsRender()}
init();