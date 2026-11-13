from weasyprint import HTML
from pathlib import Path
from html import escape
ROOT=Path(__file__).resolve().parents[1]
out=ROOT/'guides'
out.mkdir(exist_ok=True)
common_css='''
@page {size:A4; margin:18mm 18mm 17mm}
*{box-sizing:border-box}
body{background:#fffdf8;color:#0b4550;font:12px "Noto Sans Arabic",Tahoma,sans-serif;margin:0}
.top{border-bottom:2px solid #218f91;padding:0 0 14px;margin-bottom:24px;display:flex;justify-content:space-between;align-items:center;direction:ltr}
.logo{font-family:Georgia,serif;font-size:27px;letter-spacing:.05em;color:#0b4550}
.small{color:#218f91;font:9px Arial,sans-serif;letter-spacing:.11em}
.tag{background:#e4f1e8;border:1px solid #cfe1d8;border-radius:4px;padding:7px 12px;color:#387671;font-size:10px}
h1{font-size:25px;line-height:1.5;margin:0 0 8px;color:#0b4550}h2{font-size:15px;line-height:1.6;color:#218f91;margin:23px 0 9px}
p,li{line-height:1.95;color:#486d6c}li{margin-bottom:6px}
.ar{direction:rtl;text-align:right}.en{direction:ltr;text-align:left;border-top:1px solid #d9e7df;padding-top:15px;margin-top:19px}
.en h1{font-size:19px;font-family:Georgia,serif}.en p,.en li{font-family:Arial,sans-serif;line-height:1.75;font-size:11px}
.note{margin-top:20px;padding:13px 15px;background:#edf5ef;border-right:3px solid #218f91;color:#315456;border-radius:3px;line-height:1.8}.en .note{border-right:0;border-left:3px solid #218f91}
.references{font-family:Arial,sans-serif;font-size:8px;color:#66827e;margin-top:25px;border-top:1px solid #d6e6dd;padding-top:12px;overflow-wrap:anywhere}
'''
guides=[
('lymphedema-basics.pdf',
'فهم الوذمة اللمفية','Understanding lymphedema',
['الوذمة اللمفية هي تورم قد ينتج عن خلل في تصريف السائل الليمفاوي، لكن مش كل تورم بيكون وذمة لمفية.','التقييم بيشمل التاريخ المرضي والأعراض والفحص، وممكن يحتاج قياسات أو فحوص إضافية حسب الحالة.','الرعاية الموصى بها عادةً بتجمع بين الضغط المناسب، والعناية بالجلد، والحركة، وتقنيات يدوية متخصصة عند ملاءمتها.','الهدف هو التحكم في الأعراض ودعم الوظيفة اليومية، وليس وعدًا بعلاج نهائي لكل حالة.'],
['Lymphedema is swelling associated with impaired lymphatic fluid drainage, but not all swelling is lymphedema.','Assessment considers medical history, symptoms, examination, and additional tests when indicated.','Management often combines appropriate compression, skin care, exercise, and specialist manual techniques when suitable.','The aim is symptom management and function, not a guaranteed cure.']),
('visit-preparation.pdf',
'الاستعداد لأول زيارة','Preparing for your first visit',
['جهز ملخصًا بتاريخ بداية التورم وأي تغيرات لاحظتها، من غير ما تفترض بنفسك سبب المشكلة.','اكتب أسماء الأدوية والحالات الطبية والجراحات أو العلاجات السابقة ذات الصلة.','لو بتستخدم ملابس ضاغطة موصوفة، خذها أو بياناتها معاك لمناقشة الاستخدام.','اسأل عن أهداف الخطة، المتابعة، ومتى تحتاج إحالة أو تقييمًا عاجلًا.'],
['Make a short note of when swelling began and how it has changed; avoid self-diagnosing the cause.','Bring information about medications, relevant conditions, surgery, or previous treatment.','If prescribed compression garments, bring them or their details for a suitability discussion.','Ask about goals, follow-up, and when referral or urgent assessment may be needed.']),
('self-care.pdf',
'العناية الذاتية والمتابعة','Self-care and follow-up',
['التزم بتعليمات العناية بالجلد والنظافة المناسبة اللي يوضحها الفريق المعالج.','اتبع برنامج حركة مناسب لحالتك، وتجنب تغيير شدة التمرين بعشوائية لو في أعراض جديدة.','استخدم وسائل الضغط لو وصفها مختص وشرح لك طريقة الاستعمال وموانع الاستخدام.','راقب تغيرات الجلد والتورم وناقش أي تطورات مع فريقك.','لو ظهر تورم مفاجئ أو احمرار أو سخونية أو ألم غير معتاد، اطلب تقييمًا طبيًا عاجلًا. وضيق النفس أو ألم الصدر يستدعي الطوارئ.'],
['Follow the skin-care and hygiene guidance given by your treating team.','Use an individualized movement program rather than abruptly changing exercise intensity.','Use compression only when prescribed and fitted appropriately by a qualified professional.','Monitor relevant changes and discuss them with your care team.','Seek urgent medical assessment for sudden swelling, redness, fever, or unusual pain. Chest pain or breathlessness requires emergency services.'])
]
for fn,ar_title,en_title,ar_list,en_list in guides:
 ar_items=''.join('<li>'+escape(x)+'</li>' for x in ar_list)
 en_items=''.join('<li>'+escape(x)+'</li>' for x in en_list)
 body=f'''<!DOCTYPE html><html lang="ar"><meta charset="UTF-8"><style>{common_css}</style><body>
 <div class="top"><span class="logo">LYMELVA</span><span class="small">LYMPHEDEMA & PHYSICAL THERAPY • EDUCATION SERIES</span></div>
 <div class="ar"><span class="tag">دليل تثقيفي مختصر</span><h1>{escape(ar_title)}</h1><ul>{ar_items}</ul>
 <div class="note">المحتوى ده للتثقيف فقط، مش تشخيص أو خطة علاج شخصية. العيادة والاسم التجاري لسه في مرحلة التصور، وملف الدليل مش بديل عن استشارة مختص.</div></div>
 <div class="en"><h1>{escape(en_title)}</h1><ul>{en_items}</ul><div class="note">Educational information only. It does not replace individualized clinical evaluation or treatment. LYMELVA is a preliminary brand concept.</div></div>
 <div class="references">Care references: NHS — https://www.nhs.uk/conditions/lymphoedema/treatment/<br>Expert consensus on CDT (2024) — https://pubmed.ncbi.nlm.nih.gov/39487245/</div>
 </body></html>'''
 HTML(string=body,base_url=str(ROOT)).write_pdf(out/fn)
 print(fn,(out/fn).stat().st_size)
