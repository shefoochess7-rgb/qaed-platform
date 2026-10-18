(() => {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const COURSE_NAMES = { first: "أولى ثانوي", second: "تانية بكالوريا", third: "تالتة ثانوي" };
  const STORAGE = { users: "qaed_users_v1", current: "qaed_current_v1", lectures: "qaed_lectures_v1" };
  const defaultLectures = () => Object.fromEntries(Object.keys(COURSE_NAMES).map(k => [k, [{id: k+"-intro", title:"المحاضرة الأولى", url:"", note:"اصبر لسا هتنزل"}]]));
  let currentTab = "login", selectedCourse = "first";
  const safeRead = (key, fallback) => { try { const value = localStorage.getItem(key); return value ? JSON.parse(value) : fallback; } catch (_) { return fallback; } };
  const save = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (_) { toast("تعذر الحفظ على هذا الجهاز."); return false; } };
  const getUsers = () => safeRead(STORAGE.users, []);
  const getCurrent = () => safeRead(STORAGE.current, null);
  const getLectures = () => safeRead(STORAGE.lectures, defaultLectures());
  const toast = (msg) => { const el=$("#toast"); el.textContent=msg; el.classList.add("show"); clearTimeout(toast.timer); toast.timer=setTimeout(()=>el.classList.remove("show"),3000); };
  const openModal = (id) => { $("#"+id).hidden=false; document.body.style.overflow="hidden"; };
  const closeModals = () => { $$(".modal-backdrop").forEach(m=>m.hidden=true); document.body.style.overflow=""; };
  const setTab = (tab) => {
    currentTab=tab; $$(".tab").forEach(b=>b.classList.toggle("active",b.dataset.tab===tab));
    $("#nameLabel").hidden=tab!=="signup"; $("#fullName").required=tab==="signup";
    $("#authSubmit").textContent=tab==="signup"?"إنشاء الحساب":"تسجيل الدخول";
    $("#authMessage").textContent=""; $("#authMessage").className="form-message";
  };
  const openAuth = (tab="login") => { setTab(tab); openModal("authModal"); };
  const updateCounts = () => { const lectures=getLectures(); $$("[data-course]").forEach(el=>el.textContent=(lectures[el.dataset.course]||[]).length); };
  const renderCourse = (key) => {
    selectedCourse=key;
    $("#courseModalTitle").textContent=COURSE_NAMES[key];
    $("#courseSubtitle").textContent="محاضرات التاريخ الخاصة بمرحلتك الدراسية.";
    const lectures=getLectures()[key] || [];
    const list=$("#lectureList"); list.replaceChildren();
    lectures.forEach((lec) => {
      const item=document.createElement("div"); item.className="lecture-item";
      const play=document.createElement("span"); play.className="lecture-play"; play.textContent="▶";
      const info=document.createElement("div"); const title=document.createElement("strong"); title.textContent=lec.title;
      const note=document.createElement("small"); note.textContent=lec.url?"فيديو متاح عبر رابط خارجي":(lec.note||"المحاضرة غير متاحة حاليًا");
      info.append(title,note); item.append(play,info);
      if(lec.url){const link=document.createElement("a");link.href=lec.url;link.target="_blank";link.rel="noopener noreferrer";link.textContent="مشاهدة ↗";item.append(link);}
      else {const locked=document.createElement("span");locked.className="locked";locked.textContent="قريبًا";item.append(locked);}
      list.append(item);
    });
    const current=getCurrent();
    $("#adminPanel").hidden=!(current && current.isAdmin);
    openModal("courseModal");
  };
  $("#openAuth").addEventListener("click",()=>openAuth());
  $("#heroLogin").addEventListener("click",()=>openAuth());
  $("#ctaSignup").addEventListener("click",()=>openAuth("signup"));
  $$("[data-open-course]").forEach(b=>b.addEventListener("click",()=>renderCourse(b.dataset.openCourse)));
  $$("[data-close-modal]").forEach(b=>b.addEventListener("click",closeModals));
  $$(".modal-backdrop").forEach(m=>m.addEventListener("click",e=>{if(e.target===m)closeModals();}));
  document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModals();});
  $$(".tab").forEach(b=>b.addEventListener("click",()=>setTab(b.dataset.tab)));
  $("#menuToggle").addEventListener("click",()=>$("#mainNav").classList.toggle("open"));
  $$("#mainNav a").forEach(a=>a.addEventListener("click",()=>$("#mainNav").classList.remove("open")));
  $("#authForm").addEventListener("submit",e=>{
    e.preventDefault();
    const email=$("#email").value.trim().toLowerCase(), password=$("#password").value, name=$("#fullName").value.trim();
    const message=$("#authMessage"); message.className="form-message";
    const users=getUsers();
    if(currentTab==="signup"){
      if(!name){message.textContent="اكتب اسمك بالكامل.";return;}
      if(users.some(u=>u.email===email)){message.textContent="البريد ده مسجل قبل كده. جرّب تسجيل الدخول.";return;}
      users.push({name,email,password,createdAt:new Date().toISOString()}); save(STORAGE.users,users);
      save(STORAGE.current,{name,email,isAdmin:false});
      message.textContent="تم إنشاء الحساب على هذا الجهاز.";message.classList.add("success");
      setTimeout(()=>{closeModals();toast("أهلًا بيك يا "+name+"!");},650);
    } else {
      const user=users.find(u=>u.email===email&&u.password===password);
      // Admin credentials are deliberately not embedded: client-side admin checks are not secure.
      if(!user){message.textContent="بيانات الدخول غير صحيحة، أو أن الحساب غير موجود على هذا الجهاز.";return;}
      save(STORAGE.current,{name:user.name,email:user.email,isAdmin:false});
      message.textContent="تم تسجيل الدخول بنجاح.";message.classList.add("success");
      setTimeout(()=>{closeModals();toast("أهلًا بيك يا "+user.name+"!");},500);
    }
  });
  $("#lectureForm").addEventListener("submit",e=>{
    e.preventDefault();
    const current=getCurrent();
    if(!current || !current.isAdmin){toast("إضافة المحاضرات تتطلب نظام إدارة آمنًا على خادم.");return;}
    const title=$("#lectureTitle").value.trim(), url=$("#lectureUrl").value.trim();
    const all=getLectures(); all[selectedCourse]=all[selectedCourse]||[];
    all[selectedCourse].push({id:"lecture-"+Date.now(),title,url,note:url?"":"اصبر لسا هتنزل"});
    save(STORAGE.lectures,all); $("#lectureForm").reset(); renderCourse(selectedCourse); updateCounts(); toast("تمت إضافة المحاضرة على هذا الجهاز.");
  });
  $("#year").textContent=new Date().getFullYear();
  if(!localStorage.getItem(STORAGE.lectures)) save(STORAGE.lectures,defaultLectures());
  updateCounts();
})();