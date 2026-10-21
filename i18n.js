/* CloudFlow Sprachumschaltung DE/EN
 * Einbindung im <head> jeder Seite (ohne defer):  <script src="i18n.js?v=…"></script>
 * Die Seiten bleiben auf Deutsch geschrieben. Bei Englisch werden alle Texte beim Laden
 * über das Wörterbuch unten ersetzt, auch Texte, die Skripte später einfügen.
 * Neuer oder geänderter deutscher Text → hier einen Eintrag ergänzen, sonst bleibt er deutsch.
 * Sprache: ?lang=en / ?lang=de in der URL, sonst gespeicherte Wahl, sonst Deutsch.
 */
(function(){
  'use strict';
  var KEY = 'cf-lang';

  function readLang(){
    try{
      var p = new URLSearchParams(location.search).get('lang');
      if(p === 'en' || p === 'de'){ localStorage.setItem(KEY, p); return p; }
      var s = localStorage.getItem(KEY);
      if(s === 'en' || s === 'de') return s;
    }catch(e){}
    return 'de';
  }
  var LANG = readLang();
  window.CF_LANG = LANG;

  function setLang(l){
    try{ localStorage.setItem(KEY, l); }catch(e){}
    var u = new URL(location.href);
    if(u.searchParams.has('lang')){ u.searchParams.set('lang', l); location.href = u.toString(); }
    else location.reload();
  }

  // ---------- Umschalter im Header ----------
  function addSwitch(){
    var head = document.querySelector('header .head-in');
    if(!head || head.querySelector('.lang-switch')) return;
    var box = document.createElement('div');
    box.className = 'lang-switch';
    box.setAttribute('role', 'group');
    box.setAttribute('aria-label', LANG === 'en' ? 'Language' : 'Sprache');
    box.setAttribute('translate', 'no');
    ['de', 'en'].forEach(function(l){
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = l.toUpperCase();
      b.lang = l;
      b.setAttribute('aria-pressed', String(l === LANG));
      if(l === LANG) b.className = 'on';
      b.addEventListener('click', function(){ if(l !== LANG) setLang(l); });
      box.appendChild(b);
    });
    var nav = head.querySelector('nav.main');
    if(nav && nav.nextSibling) head.insertBefore(box, nav.nextSibling); else head.appendChild(box);
  }

  if(LANG !== 'en'){
    document.addEventListener('DOMContentLoaded', addSwitch);
    return;
  }

  // ---------- Wörterbuch (deutscher Text → englischer Text) ----------
  var T = {
    // Kopf, Navigation, Fuß (alle Seiten)
    'Zum Inhalt springen': 'Skip to content',
    'Startseite': 'Home',
    'Produkte': 'Products',
    'Preise': 'Pricing',
    'Kontakt': 'Contact',
    'Direkt schreiben': 'Write to us directly',
    'Jetzt kontaktieren': 'Contact us',
    'Mehr Zeit für dein Business.': 'More time for your business.',
    'KI-Chatbots für lokale Unternehmen.': 'AI chatbots for local businesses.',
    'Unternehmen': 'Company',
    'Über uns': 'About us',
    'Impressum': 'Legal notice',
    'Datenschutz': 'Privacy',
    'KI-Chatbot': 'AI chatbot',
    'Mehr erfahren': 'Learn more',
    "So funktioniert's": 'How it works',
    'Häufige Fragen': 'FAQ',
    'Kunden-Login': 'Customer login',
    '© 2026 CloudFlow. Alle Rechte vorbehalten.': '© 2026 CloudFlow. All rights reserved.',

    // Chatfenster (Startseite, Vorschau)
    'Chat schließen': 'Close chat',
    'Chat öffnen': 'Open chat',
    'Chat öffnen/schließen': 'Open/close chat',
    'Menü': 'Menu',
    'Senden': 'Send',
    'Nachricht schreiben …': 'Type a message …',
    'Online · antwortet sofort': 'Online · replies instantly',
    'Wähle ein Thema oder schreib uns direkt.': 'Pick a topic or just ask us.',
    'Eine Frage stellen …': 'Ask a question …',
    'Neues Gespräch': 'New conversation',
    'KI-Assistent · Chatbot von': 'AI assistant · Chatbot by',
    'Hallo und willkommen bei CloudFlow 👋 Gerne beraten wir dich zu unseren Chatbots, Preisen oder wie du startest.': 'Hi and welcome to CloudFlow 👋\nHappy to help with our chatbots, pricing or how to get started.',
    'Was kostet das?': 'How much does it cost?',
    'Wie läuft der Ablauf ab?': 'How does the process work?',
    'Brauche ich technisches Wissen?': 'Do I need technical knowledge?',
    'Ablauf': 'Process',
    'Technik nötig?': 'Tech skills needed?',
    'Entschuldigung, da ist etwas schiefgelaufen. Versuch es gleich nochmal.': 'Sorry, something went wrong. Please try again.',
    'Der Chatbot ist gerade nicht erreichbar. Versuch es in ein paar Sekunden nochmal.': 'The chatbot is not reachable right now. Please try again in a few seconds.',

    // Startseite
    'CloudFlow — KI-Chatbot für deine Website': 'CloudFlow — AI chatbot for your website',
    'Der KI-Chatbot für lokale Unternehmen: beantwortet Kundenfragen rund um die Uhr, lernt aus deinen PDFs und ist in wenigen Tagen live. Ab 29,99 € pro Monat.': 'The AI chatbot for local businesses: answers customer questions around the clock, learns from your PDFs and goes live within days. From €29.99 per month.',
    'KI-Chatbots für lokale Unternehmen': 'AI chatbots for local businesses',
    'Dein Chatbot beantwortet Kundenfragen –': 'Your chatbot answers customer questions –',
    'rund um die Uhr.': 'around the clock.',
    'Freundlich, schnell, immer erreichbar. Ganz ohne technisches Vorwissen für dich.': 'Friendly, fast, always available. No technical knowledge needed on your side.',
    'Jetzt beraten lassen': 'Get advice now',
    'Kostenlose Beratung vereinbaren': 'Book a free consultation',
    'Chat ausprobieren →': 'Try the chat →',
    '24/7 erreichbar': 'Available 24/7',
    'In wenigen Tagen live': 'Live within days',
    'Antwortet aus deinen PDFs': 'Answers from your PDFs',
    'In drei Schritten startklar': 'Ready in three steps',
    'Kein technisches Vorwissen nötig — du musst nur dein Business kennen.': 'No technical knowledge needed — you just need to know your business.',
    'Kurzes Gespräch': 'Short call',
    'Wir besprechen dein Business — Öffnungszeiten, Angebot, häufige Fragen, deinen Ton.': 'We talk about your business — opening hours, services, common questions, your tone.',
    'Bot wird gebaut': 'We build the bot',
    'Innerhalb weniger Tage bekommst du einen fertigen, getesteten Chatbot — individuell für dich.': 'Within a few days you get a finished, tested chatbot — made just for you.',
    'Live auf deiner Website': 'Live on your website',
    'Ich binde den Bot direkt ein. Du siehst sofort, wie er mit echten Besuchern chattet.': 'I add the bot to your site. You immediately see it chatting with real visitors.',
    'Das Produkt': 'The product',
    'Dein KI-Chatbot': 'Your AI chatbot',
    'Beantwortet Kundenfragen automatisch, rund um die Uhr — von Öffnungszeiten bis Reservierungswünschen. Lade deine PDFs hoch, und der Bot antwortet auf Basis deiner Unterlagen.': 'Answers customer questions automatically, around the clock — from opening hours to reservation requests. Upload your PDFs and the bot answers based on your documents.',
    'Ein Produkt, klare Preise — Einrichtung einmalig, danach nur der Monatspreis': 'One product, clear pricing — one-time setup, then just the monthly price',
    'Lernt aus deinen PDFs: Speisekarte, Preisliste, Infos': 'Learns from your PDFs: menu, price list, info',
    'In wenigen Tagen live auf deiner Website': 'Live on your website within days',
    'Preise ansehen': 'See pricing',
    'Mehr erfahren →': 'Learn more →',
    'Design wählen →': 'Choose a design →',
    'Habt ihr heute offen?': 'Are you open today?',
    'Ja! Wir haben heute von 9 bis 18 Uhr geöffnet. Möchtest du einen Termin vereinbaren?': 'Yes! We are open today from 9 am to 6 pm. Would you like to book an appointment?',
    'Preisliste_2026.pdf': 'Price_list_2026.pdf',
    'Was kostet ein Haarschnitt?': 'How much is a haircut?',
    'Laut Preisliste: ab 28 €. Soll ich dir einen Termin eintragen?': 'According to the price list: from €28. Shall I book you an appointment?',
    'Alles, was du vorher wissen solltest.': 'Everything you should know up front.',
    'Nein. Du musst nur dein Business kennen — den Rest übernehme ich, von der Einrichtung bis zur Einbindung auf deiner Website.': 'No. You just need to know your business — I take care of the rest, from setup to adding it to your website.',
    'Wie lange dauert die Einrichtung?': 'How long does setup take?',
    'Je nach Paket meist wenige Tage bis eine Woche, ab unserem ersten Gespräch.': 'Depending on the plan, usually a few days to a week from our first call.',
    'Was kostet der laufende Betrieb?': 'What are the running costs?',
    'Zum monatlichen Preis kommt einmalig eine Einrichtungsgebühr (Basic 149 €, Standard 249 €, Premium 399 €), dafür richten wir alles für dich ein. Bei jährlicher Zahlung entfällt sie bei allen Paketen. Sonst gibt es keine versteckten Zusatzkosten. Bei jährlicher Zahlung sparst du 20%, jederzeit kündbar.': 'On top of the monthly price there is a one-time setup fee (Basic €149, Standard €249, Premium €399), for which we set everything up for you. With annual billing it is waived for all plans. There are no other hidden costs. With annual billing you save 20%, cancel anytime.',
    'Kann der Bot auch Termine entgegennehmen?': 'Can the bot take appointment requests?',
    'Ja, ab dem Standard-Paket kann der Bot Reservierungs- und Terminwünsche strukturiert aufnehmen.': 'Yes, from the Standard plan the bot can collect reservation and appointment requests in a structured way.',
    'Kann ich den Bot später ändern lassen?': 'Can I have the bot changed later?',
    'Klar — Öffnungszeiten, Preise oder neue Infos lassen sich jederzeit nachpflegen, je nach Paket inklusive oder gegen kleine Zusatzkosten.': 'Sure — opening hours, prices or new info can be updated anytime, included or for a small fee depending on your plan.',
    'Bereit für deinen eigenen Chatbot?': 'Ready for your own chatbot?',
    'Starte unverbindlich mit einer kostenlosen Testphase — kein Risiko, jederzeit kündbar.': 'Start with a free, no-obligation trial — no risk, cancel anytime.',
    'Kostenlos starten': 'Start for free',
    '14 Tage unverbindlich testen': '14-day free trial, no obligation',
    '14 Tage testen': '14-day trial',
    'Unverbindlich': 'No obligation',
    'Jederzeit kündbar': 'Cancel anytime',

    // Produkte
    'Produkte — CloudFlow KI-Chatbot': 'Products — CloudFlow AI chatbot',
    'Der CloudFlow Chatbot im Detail: Antworten aus deinen PDFs, eigenes Design und Farben, Live-Demo zum Ausprobieren.': 'The CloudFlow chatbot in detail: answers from your PDFs, your own design and colors, a live demo to try.',
    'Werbespot: Ein Chatbot beantwortet auf der Website eines Friseurs die Frage nach dem Preis eines Haarschnitts. Ab 29,99 Euro im Monat.': 'Ad spot: a chatbot on a hair salon website answers a question about the price of a haircut. From 29.99 euros per month.',
    'z. B. Wie sind eure Bürozeiten?': 'e.g. What are your office hours?',
    'z. B. Lena von Café Wien': 'e.g. Lena from Café Wien',
    'z. B. Servus! Wie kann ich dir helfen?': 'e.g. Hi there! How can I help you?',
    'Beschreib, was wir ändern sollen — z. B. andere Schriftart, Button links statt rechts, Antworten im Dialekt, eigene Schnellantwort-Buttons …': 'Describe what we should change — e.g. a different font, button on the left instead of the right, answers in dialect, your own quick-reply buttons …',
    'Der CloudFlow Chatbot': 'The CloudFlow chatbot',
    'Ein persönlicher Chatbot für deine Website — er lernt aus deinen hochgeladenen PDFs und beantwortet Kundenfragen rund um die Uhr.': 'A personal chatbot for your website — it learns from the PDFs you upload and answers customer questions around the clock.',
    'Kurz erklärt': 'In short',
    'CloudFlow in 15 Sekunden': 'CloudFlow in 15 seconds',
    'Deine Kunden stellen immer wieder dieselben Fragen: Öffnungszeiten, Preise, Anfahrt. Der CloudFlow-Chatbot beantwortet sie direkt auf deiner Website, mit den Infos aus deinen eigenen PDFs.': 'Your customers keep asking the same questions: opening hours, prices, directions. The CloudFlow chatbot answers them right on your website, using the info from your own PDFs.',
    'Antwortet rund um die Uhr': 'Answers around the clock',
    'Nur mit den Infos aus deinen Unterlagen': 'Only with the info from your documents',
    'Wir richten alles für dich ein': 'We set everything up for you',
    'Preise anschauen →': 'See pricing →',
    'Beispiele ansehen ↓': 'See examples ↓',
    'Abspielen': 'Play',
    'Automatisiere deinen Kundenservice': 'Automate your customer service',
    'Die meisten Anfragen sind wiederkehrend — Öffnungszeiten, Preise, Reservierungswünsche. Dein CloudFlow-Chatbot beantwortet sie automatisch, rund um die Uhr, während du dich um dein Business kümmerst.': 'Most enquiries are repetitive — opening hours, prices, reservation requests. Your CloudFlow chatbot answers them automatically, around the clock, while you take care of your business.',
    '24/7 verfügbar': 'Available 24/7',
    'Ohne Wartezeit': 'No waiting',
    'In Tagen live': 'Live in days',
    'Hallo! Wie kann ich dir helfen?': 'Hi! How can I help you?',
    'Habt ihr am Sonntag offen?': 'Are you open on Sunday?',
    'Ja, sonntags von 9:00 bis 15:00 Uhr 😊': 'Yes, on Sundays from 9 am to 3 pm 😊',
    'Ja, sonntags von 9:00 bis 15:00 Uhr.': 'Yes, on Sundays from 9 am to 3 pm.',
    'Kennt dein Unternehmen': 'Knows your business',
    'Lade PDFs hoch — FAQ, Preisliste, Speisekarte — und dein Chatbot antwortet auf Basis deiner Dokumente. Einfach im Preis enthalten.': 'Upload PDFs — FAQ, price list, menu — and your chatbot answers based on your documents. Included in the price.',
    'PDF-Upload': 'PDF upload',
    'Sofort einsatzbereit': 'Ready to use right away',
    'Sicher gespeichert': 'Stored securely',
    'Garantiebedingungen.pdf': 'Warranty_terms.pdf',
    'Frage:': 'Question:',
    'Wie lange gilt die Garantie?': 'How long is the warranty?',
    'Antwort:': 'Answer:',
    'Laut Dokument beträgt die Garantiezeit 24 Monate.': 'According to the document, the warranty period is 24 months.',
    'LIVE-DEMO': 'LIVE DEMO',
    "Probier's direkt aus": 'Try it right now',
    'Stell eine Frage — die Antwort kommt vom echten Chatbot.': 'Ask a question — the answer comes from the real chatbot.',
    'Fragen': 'Ask',
    'Sucht …': 'Searching …',
    'ANTWORT': 'ANSWER',
    'Dazu konnte ich leider nichts finden.': 'Sorry, I could not find anything on that.',
    'Die Demo ist gerade nicht erreichbar. Versuch es gleich nochmal.': 'The demo is not reachable right now. Please try again shortly.',
    'Design wählen ↓': 'Choose a design ↓',
    'Beispiele': 'Examples',
    'So antwortet dein Chatbot': 'How your chatbot answers',
    'Erfundene Beispiel-Gespräche, damit du ein Gefühl bekommst. Dein Chatbot antwortet immer nur mit dem, was in deinen eigenen PDFs steht.': 'Made-up example conversations to give you a feel for it. Your chatbot only ever answers with what is in your own PDFs.',
    'Restaurant': 'Restaurant',
    'Habt ihr heute einen Tisch für 4 um 19 Uhr?': 'Do you have a table for 4 at 7 pm today?',
    'Reservierungen nehmen wir unter der Telefonnummer auf unserer Kontaktseite entgegen. Unsere Küche ist täglich von 11:30 bis 22:00 Uhr geöffnet.': 'We take reservations by phone at the number on our contact page. Our kitchen is open daily from 11:30 am to 10 pm.',
    'Gibt es vegetarische Gerichte?': 'Do you have vegetarian dishes?',
    'Ja, auf unserer Speisekarte sind vegetarische Gerichte gekennzeichnet, zum Beispiel die Kürbis-Lasagne.': 'Yes, vegetarian dishes are marked on our menu, for example the pumpkin lasagne.',
    'Friseur': 'Hair salon',
    'Was kostet ein Herrenschnitt?': "How much is a men's haircut?",
    'Laut unserer Preisliste kostet der Herrenschnitt 32 €, mit Waschen 38 €.': "According to our price list, a men's haircut is €32, or €38 with a wash.",
    'Muss ich vorher einen Termin machen?': 'Do I need to book an appointment?',
    'Wir empfehlen einen Termin, spontane Besuche sind je nach Auslastung möglich.': 'We recommend booking; walk-ins are possible depending on availability.',
    'Handwerk': 'Trades',
    'Macht ihr auch Notdienste am Wochenende?': 'Do you offer emergency service on weekends?',
    'Ja, unser Notdienst ist am Wochenende unter der Nummer in unserem Infoblatt erreichbar. Dafür gilt ein Zuschlag.': 'Yes, our emergency service is available on weekends at the number in our info sheet. A surcharge applies.',
    'In welchem Gebiet seid ihr tätig?': 'Which area do you cover?',
    'Wir arbeiten in Wien und im Umkreis von 30 km.': 'We work in Vienna and within a 30 km radius.',
    'Die Gespräche sind frei erfunden und dienen nur als Beispiel.': 'These conversations are made up and only serve as examples.',
    'Individuell': 'Custom',
    'Wähle dein Design': 'Choose your design',
    'So kann dein Chatbot auf deiner Website aussehen. Such dir Button und Chatfenster aus und stell deine Farben ein — probier es gleich aus. Gespeichert wird dein Design später im Kunden-Dashboard, sobald du ein Paket gewählt hast. Name und Begrüßung gibt es in jedem Paket, Logo und Themen-Buttons mit Premium.': 'This is how your chatbot can look on your website. Pick a button and chat window and set your colors — try it right away. Your design is saved later in the customer dashboard once you have chosen a plan. Name and greeting are included in every plan, logo and topic buttons with Premium.',
    'Button unten rechts': 'Button in the bottom right',
    'Damit öffnen deine Besucher den Chat.': 'Your visitors open the chat with it.',
    'Quadrat': 'Square',
    'Navy, mit Logo': 'Navy, with logo',
    'Frag uns!': 'Ask us!',
    'Rechteck mit Text': 'Rectangle with text',
    'Lädt zum Fragen ein': 'Invites questions',
    'Rund': 'Round',
    'Der Klassiker': 'The classic',
    'Weiße Karte': 'White card',
    'Mit „Online“-Punkt': 'With “online” dot',
    'Himmel-Verlauf': 'Sky gradient',
    'Passend zur Website': 'Matches the website',
    'Chatfenster': 'Chat window',
    'So sieht das Gespräch aus — mit Begrüßung, Themen-Buttons und Eingabefeld.': 'This is how the conversation looks — with greeting, topic buttons and input field.',
    'Klassisch': 'Classic',
    'Farbige Kopfzeile': 'Colored header',
    'Himmel': 'Sky',
    'Weicher Farbverlauf': 'Soft gradient',
    'Minimal': 'Minimal',
    'Weiß mit feinen Linien': 'White with fine lines',
    'Dunkel': 'Dark',
    'Nachtmodus': 'Night mode',
    'Farben': 'Colors',
    'Passe alles an deine Marke an — die Auswahl oben und die Vorschau unten färben sich sofort um.': 'Match everything to your brand — the options above and the preview below change color instantly.',
    'Hauptfarbe (Kopfzeile, Button)': 'Main color (header, button)',
    'Akzentfarbe (Nachrichten, Senden)': 'Accent color (messages, send)',
    'Oder ein fertiges Farbschema': 'Or a ready-made color scheme',
    'Wald': 'Forest',
    'Beere': 'Berry',
    'Violett': 'Violet',
    'Sonne': 'Sun',
    'Grau': 'Grey',
    'Eigene Farben': 'Custom colors',
    'Dein persönliches Extra': 'Your personal extra',
    'Probier es aus: Mit dem Premium-Paket gestalten wir den Chatbot ganz individuell für dich.': 'Try it: with the Premium plan we design the chatbot entirely for you.',
    'Individuelle Wünsche': 'Custom requests',
    'Eigenes Logo und eigene Themen-Buttons bearbeitest du selbst im Dashboard, dazu setzen wir Texte, Bilder und alle Sonderwünsche für dich um. Name und Begrüßung gibt es in jedem Paket.': 'You edit your own logo and topic buttons yourself in the dashboard, and we implement texts, images and all special requests for you. Name and greeting are included in every plan.',
    'Name deines Assistenten': "Your assistant's name",
    'Begrüßungstext': 'Greeting text',
    'Eigenes Logo (für Button und Kopfzeile)': 'Your own logo (for button and header)',
    'Logo hochladen (PNG, SVG, JPG)': 'Upload logo (PNG, SVG, JPG)',
    'Bilder / Vorlagen für unsere Gestaltung': 'Images / templates for our design work',
    'Bilder auswählen (mehrere möglich)': 'Choose images (multiple allowed)',
    'Deine Sonderwünsche': 'Your special requests',
    'Wünsche per E-Mail senden': 'Send requests by email',
    'Logo und Bilder hängst du bitte in der E-Mail als Anhang an. Wir melden uns schnell bei dir.': 'Please attach your logo and images to the email. We will get back to you quickly.',
    'Live-Vorschau': 'Live preview',
    'Klick auf den Button unten rechts, um den Chat zu öffnen und zu schließen.': 'Click the button in the bottom right to open and close the chat.',
    'www.deine-website.at': 'www.your-website.com',
    'Deine Auswahl:': 'Your selection:',
    'Dieses Design anfragen': 'Request this design',
    'Hallo und willkommen! 👋 Wie kann ich dir helfen?': 'Hi and welcome! 👋 How can I help you?',
    'Öffnungszeiten': 'Opening hours',
    'Termin vereinbaren': 'Book an appointment',

    // Preise
    'Preise — CloudFlow KI-Chatbot': 'Pricing — CloudFlow AI chatbot',
    'Transparente Preise: Basic 29,99 €, Standard 49,49 €, Premium 89,99 € pro Monat. Jederzeit kündbar, 20 % sparen bei jährlicher Zahlung.': 'Transparent pricing: Basic €29.99, Standard €49.49, Premium €89.99 per month. Cancel anytime, save 20% with annual billing.',
    'Zahlweise wählen': 'Choose billing',
    'Transparent & fair': 'Transparent & fair',
    'Ein Chatbot, klare Preise — dazu einmalig eine Einrichtungsgebühr (bei Jahreszahlung gratis), jederzeit kündbar.': 'One chatbot, clear pricing — plus a one-time setup fee (free with annual billing), cancel anytime.',
    'So möchtest du zahlen:': 'How would you like to pay?',
    'Monatlich': 'Monthly',
    'Flexibel, jederzeit kündbar': 'Flexible, cancel anytime',
    '20 % sparen': 'Save 20%',
    'Jährlich': 'Yearly',
    'Einrichtung gratis': 'Free setup',
    'Für den Einstieg': 'To get started',
    'pro Monat': 'per month',
    'pro Jahr': 'per year',
    '· bis zu 5 Dokumente': '· up to 5 documents',
    '· bis zu 15 Dokumente': '· up to 15 documents',
    '· bis zu 30 Dokumente': '· up to 30 documents',
    'Einrichtung entfällt bei Jahreszahlung': 'setup waived with annual billing',
    'Basic wählen': 'Choose Basic',
    'Standard wählen': 'Choose Standard',
    'Premium wählen': 'Choose Premium',
    'Details und Vorteile': 'Details and benefits',
    'Bis zu 500 Nachrichten pro Monat': 'Up to 500 messages per month',
    'Bis zu 2.000 Nachrichten pro Monat': 'Up to 2,000 messages per month',
    'Bis zu 5.000 Nachrichten pro Monat': 'Up to 5,000 messages per month',
    'Einbindung auf einer Seite': 'Embedded on one website',
    '1 Anpassungsrunde / Monat': '1 revision round / month',
    '2 Anpassungsrunden / Monat': '2 revision rounds / month',
    'Design & Farben frei wählbar': 'Choose your own design & colors',
    'Eigener Name & Begrüßung': 'Your own name & greeting',
    'Antwortet in jeder Sprache': 'Answers in any language',
    'Beliebt': 'Popular',
    'Der Alltagsbegleiter': 'The everyday companion',
    'Alles aus Basic': 'Everything in Basic',
    'Alles aus Standard': 'Everything in Standard',
    'Termin-/Reservierungsanfragen': 'Appointment/reservation requests',
    'Für mehrere Standorte': 'For multiple locations',
    'Eigenes Logo & Themen-Buttons selbst bearbeiten': 'Edit your own logo & topic buttons',
    'Eigene Texte & Bilder': 'Your own texts & images',
    'Individuelle Sonderwünsche (bis zu 2 Std. pro Monat)': 'Custom special requests (up to 2 hrs per month)',
        'Die Einrichtung ist eine einmalige Gebühr (bei Jahreszahlung gratis): Wir richten deinen Chatbot ein, laden mit dir deine Dokumente hoch, stellen dein Design ein und bauen ihn auf deiner Website ein. In jedem Paket lädst du PDFs hoch (z. B. Speisekarte, Preisliste, FAQ) — dein Chatbot antwortet auf Basis deiner Dokumente.': 'Setup is a one-time fee (free with annual billing): we set up your chatbot, upload your documents with you, configure your design and add it to your website. In every plan you upload PDFs (e.g. menu, price list, FAQ) — your chatbot answers based on your documents.',

    // Paket-Details
    'Paket-Details — CloudFlow': 'Plan details — CloudFlow',
    'Alle Details zu den CloudFlow-Paketen Basic, Standard und Premium: Leistungen, Unterschiede, Design und Ablauf.': 'All details on the CloudFlow plans Basic, Standard and Premium: features, differences, design and process.',
    'z. B. Müller Assistent': 'e.g. Miller Assistant',
    'Hallo! Wie kann ich helfen?': 'Hi! How can I help?',
    'Öffnungszeiten = Wann habt ihr geöffnet?': 'Opening hours = When are you open?',
    'z. B. Dunkelgrün #0B3D2E und Orange #EA580C': 'e.g. dark green #0B3D2E and orange #EA580C',
    'Paket': 'Plan',
    'Das ist enthalten': "What's included",
    'Für wen passt das?': 'Who is it for?',
    'Die Pakete im Vergleich': 'Plans compared',
    'Dein Design': 'Your design',
    'Design ausprobieren': 'Try the design',
    'Premium: Dein Chatbot ganz individuell': 'Premium: your chatbot, fully custom',
    'Sag uns, wie dein Chatbot heißen, aussehen und klingen soll. Wir richten es für dich ein. Nach dem Start kannst du vieles selbst im Dashboard ändern.': 'Tell us what your chatbot should be called, look like and sound like. We set it up for you. After launch you can change a lot yourself in the dashboard.',
    'Name des Chatbots': "Chatbot's name",
    'Begrüßung': 'Greeting',
    'Themen-Buttons (je Zeile: Titel = Frage)': 'Topic buttons (one per line: title = question)',
    'Logo (Link oder „schicke ich per Mail“)': 'Logo (link or “I will send it by email”)',
    'Wunschfarben': 'Preferred colors',
    'Sonderwünsche (Texte, Bilder, Sprachen, mehrere Standorte)': 'Special requests (texts, images, languages, multiple locations)',
    'So läuft es ab': 'How it works',
    'Anfragen.': 'Request.',
    'Du schreibst uns, welches Paket du möchtest.': 'You tell us which plan you want.',
    'Rechnung.': 'Invoice.',
    'Du bekommst eine Rechnung mit unserer IBAN. Sie enthält die einmalige Einrichtung und den ersten Monat. Bei Zahlung für ein ganzes Jahr im Voraus entfällt die Einrichtung bei allen Paketen.': 'You receive an invoice with our IBAN. It covers the one-time setup and the first month. If you pay for a full year in advance, setup is free for all plans.',
    'Dauerauftrag.': 'Standing order.',
    'Am einfachsten richtest du bei deiner Bank einen Dauerauftrag ein. Dann musst du an nichts mehr denken.': 'The easiest way is to set up a standing order with your bank. Then you do not have to think about it again.',
    'Wir richten alles ein.': 'We set everything up.',
    'Wir laden gemeinsam mit dir deine PDFs hoch, stellen dein Design ein und bauen den Chatbot auf deiner Website ein. Danach kannst du Dokumente und Design jederzeit selbst im Dashboard ändern.': 'Together with you we upload your PDFs, configure your design and add the chatbot to your website. After that you can change documents and design yourself in the dashboard anytime.',
    'Jederzeit kündbar.': 'Cancel anytime.',
    'Du kannst ohne Mindestlaufzeit kündigen. Dein Chatbot läuft bis zum Ende des bezahlten Zeitraums weiter.': 'There is no minimum term. Your chatbot keeps running until the end of the paid period.',
    'Läuft ein Abo ab, siehst du im Dashboard einen Hinweis. Nach 7 Tagen Kulanz wird der Chatbot pausiert, bis die Zahlung da ist.': 'When a subscription expires, you see a notice in the dashboard. After a 7-day grace period the chatbot is paused until payment arrives.',
    'Dieses Paket anfragen': 'Request this plan',
    'Bis zu 5 PDF-Dokumente (z. B. Speisekarte, Preisliste, FAQ)': 'Up to 5 PDF documents (e.g. menu, price list, FAQ)',
    'Bis zu 500 Nachrichten pro Monat (faire Nutzung)': 'Up to 500 messages per month (fair use)',
    'Einbindung auf einer Seite deiner Website': 'Embedded on one page of your website',
    '1 Anpassungsrunde pro Monat': '1 revision round per month',
    'Design und Farben frei wählbar: Button, Chatfenster, zwei Farben': 'Choose your own design and colors: button, chat window, two colors',
    'Eigener Name und eigene Begrüßung für deinen Chatbot': 'Your own name and greeting for your chatbot',
    'Zugang zum Kunden-Dashboard': 'Access to the customer dashboard',
    'Du willst einfach loslegen und die häufigsten Fragen deiner Kunden automatisch beantworten lassen, zum Beispiel Öffnungszeiten, Preise und Anfahrt.': "You simply want to get started and have your customers' most common questions answered automatically, for example opening hours, prices and directions.",
    'Warum Standard statt Basic?': 'Why Standard instead of Basic?',
    'Du bekommst mehr Dokumente (15 statt 5), viermal so viele Nachrichten (2.000 statt 500), 2 Anpassungsrunden und Terminanfragen. Wenn dein Chatbot viel genutzt wird, lohnt sich das.': 'You get more documents (15 instead of 5), four times as many messages (2,000 instead of 500), 2 revision rounds and appointment requests. Worth it if your chatbot is used a lot.',
    'Du wählst Button, Chatfenster, zwei Farben sowie Namen und Begrüßung selbst. Alles speicherst du im Kunden-Dashboard.': 'You choose the button, chat window, two colors, name and greeting yourself. You save everything in the customer dashboard.',
    'Bis zu 15 PDF-Dokumente': 'Up to 15 PDF documents',
    'Bis zu 2.000 Nachrichten pro Monat (faire Nutzung)': 'Up to 2,000 messages per month (fair use)',
    '2 Anpassungsrunden pro Monat': '2 revision rounds per month',
    'Termin- und Reservierungsanfragen': 'Appointment and reservation requests',
    'Design und Farben frei wählbar': 'Choose your own design and colors',
    'Dein Business hat viele Kunden und viele Fragen, etwa ein Restaurant, einen Friseur oder einen Handwerksbetrieb. Der Chatbot soll rund um die Uhr zuverlässig Auskunft geben.': 'Your business has many customers and many questions, like a restaurant, a hair salon or a trades business. The chatbot should give reliable answers around the clock.',
    'Warum Premium statt Standard?': 'Why Premium instead of Standard?',
    'Du bekommst ein eigenes Logo, eigenen Namen, Begrüßung und Themen-Buttons, individuelle Sonderwünsche und 30 statt 15 Dokumente. Ideal bei mehreren Standorten oder wenn der Chatbot ganz zu deiner Marke passen soll.': 'You get your own logo, name, greeting and topic buttons, custom special requests and 30 instead of 15 documents. Ideal for multiple locations or if the chatbot should fully match your brand.',
    'Wie bei Basic wählst du Button, Chatfenster, Farben, Namen und Begrüßung. Dazu bekommst du mehr Platz für Dokumente und Anfragen.': 'As with Basic, you choose the button, chat window, colors, name and greeting. On top you get more room for documents and requests.',
    'Bis zu 30 PDF-Dokumente': 'Up to 30 PDF documents',
    'Bis zu 5.000 Nachrichten pro Monat (faire Nutzung)': 'Up to 5,000 messages per month (fair use)',
    'Eigenes Logo und eigene Themen-Buttons, im Dashboard selbst bearbeitbar': 'Your own logo and topic buttons, editable in the dashboard',
    'Individuelle Sonderwünsche für Texte und Bilder (bis zu 2 Stunden pro Monat)': 'Custom special requests for texts and images (up to 2 hours per month)',
    'Antwortet in der Sprache deiner Kunden (z. B. Deutsch und Englisch)': "Answers in your customers' language (e.g. German and English)",
    'Design komplett individuell, auf Wunsch gemeinsam mit uns': 'Fully custom design, together with us if you like',
    'Du hast mehrere Standorte oder willst, dass der Chatbot aussieht und klingt wie dein Unternehmen.': 'You have multiple locations or want the chatbot to look and sound like your business.',
    'Warum Premium?': 'Why Premium?',
    'Dein Chatbot trägt dein Logo und deinen Namen und spricht so, wie du es willst. Dazu kommen die meisten Dokumente und Platz für Sonderwünsche.': 'Your chatbot carries your logo and name and talks the way you want. Plus the most documents and room for special requests.',
    'Du bearbeitest alles selbst im Dashboard: Button, Chatfenster, Farben, Name, Begrüßung, Themen-Buttons und Logo. Für alles Weitere setzen wir dir deine Sonderwünsche um.': 'You edit everything yourself in the dashboard: button, chat window, colors, name, greeting, topic buttons and logo. For anything else, we implement your special requests.',
    'Dokumente (PDF)': 'Documents (PDF)',
    'Nachrichten pro Monat (faire Nutzung)': 'Messages per month (fair use)',
    'Design: Button, Chatfenster, Farben': 'Design: button, chat window, colors',
    'Anpassungsrunden pro Monat': 'Revision rounds per month',
    'nach Absprache': 'by arrangement',
    'Eigener Name und Begrüßung': 'Your own name and greeting',
    'Eigenes Logo und Themen-Buttons (selbst bearbeitbar)': 'Your own logo and topic buttons (self-editable)',
    'Eigene Texte und Bilder': 'Your own texts and images',
    'Mehrsprachig': 'Multilingual',
    'Individuelle Sonderwünsche': 'Custom special requests',
    '✓ (bis zu 2 Std. / Monat)': '✓ (up to 2 hrs / month)',
    'Einrichtung (einmalig)': 'Setup (one-time)',
    'Preis pro Monat': 'Price per month',

    // Kontakt
    'Kontakt — CloudFlow': 'Contact — CloudFlow',
    'Schreib uns an kontakt@cloudflow.at — wir melden uns meist innerhalb von 24 Stunden.': 'Write to us at kontakt@cloudflow.at — we usually reply within 24 hours.',
    'E-Mail': 'Email',
    'Kurz worum es geht …': 'Briefly, what is it about …',
    'Lass uns reden': "Let's talk",
    "Schreib uns kurz, worum's geht — wir melden uns meist innerhalb von 24 Stunden.": 'Tell us briefly what it is about — we usually reply within 24 hours.',
    'Direkt per Mail erreichbar — keine Warteschleife, keine Ticket-Nummer.': 'Reachable directly by email — no hold music, no ticket number.',
    'Wer steckt hinter CloudFlow?': 'Who is behind CloudFlow?',
    'CloudFlow wird von Lelek und einem Mitschüler entwickelt und betreut. Wir bauen und betreuen jeden Chatbot persönlich, ohne Agentur-Overhead, und sind direkt erreichbar, wenn etwas angepasst werden soll.': 'CloudFlow is developed and run by Lelek and a classmate. We build and look after every chatbot personally, without agency overhead, and you can reach us directly whenever something needs adjusting.',
    'Oder schreib uns direkt hier': 'Or write to us right here',
    'Formular ausfüllen, wir melden uns per Mail zurück.': 'Fill in the form and we will get back to you by email.',
    'Nachricht senden': 'Send message',

    // Impressum
    'Impressum — CloudFlow': 'Legal notice — CloudFlow',
    'Impressum und Angaben zum Diensteanbieter von CloudFlow.': 'Legal notice and service provider information for CloudFlow.',
    'Angaben gemäß § 5 E-Commerce-Gesetz (ECG) und § 25 Mediengesetz': 'Information pursuant to § 5 Austrian E-Commerce Act (ECG) and § 25 Austrian Media Act',
    'Hinweis für den Betreiber:': 'Note for the operator:',
    'Alle gelb markierten Felder musst du vor dem Start mit deinen echten Angaben ausfüllen. Diese Seite ersetzt keine Rechtsberatung — lass Impressum und Datenschutz am besten kurz von der WKO, einem Steuerberater oder einem Anwalt prüfen.': 'You must fill in all fields marked in yellow with your real details before launch. This page is not legal advice — ideally have the legal notice and privacy policy checked by the WKO, a tax advisor or a lawyer.',
    'Medieninhaber und Diensteanbieter': 'Media owner and service provider',
    ', Österreich': ', Austria',
    'E-Mail:': 'Email:',
    'Telefon:': 'Phone:',
    'Unternehmensgegenstand': 'Business purpose',
    'Entwicklung, Einrichtung und Betrieb von KI-gestützten Chatbots für Websites.': 'Development, setup and operation of AI-powered chatbots for websites.',
    'Gewerbe und Aufsicht': 'Trade license and supervision',
    'Gewerbebehörde:': 'Trade authority:',
    'Gewerbewortlaut:': 'Registered trade:',
    'UID-Nummer:': 'VAT ID:',
    'Firmenbuchnummer und -gericht:': 'Company register number and court:',
    'Mitglied der Wirtschaftskammer': 'Member of the Austrian Economic Chamber,',
    'Anwendbare Rechtsvorschriften: Gewerbeordnung (abrufbar unter': 'Applicable regulations: Austrian Trade Regulation Act (available at',
    'Grundlegende Richtung': 'Editorial policy',
    'Information über die Chatbot-Dienstleistungen von CloudFlow.': "Information about CloudFlow's chatbot services.",
    'Streitbeilegung': 'Dispute resolution',
    'Verbraucher können Beschwerden an die Online-Streitbeilegungsplattform der EU richten:': "Consumers can submit complaints to the EU's online dispute resolution platform:",
    '. Wir sind zur Teilnahme an einem Streitbeilegungsverfahren nicht verpflichtet.': '. We are not obliged to take part in dispute resolution proceedings.',
    'Haftung für Inhalte': 'Liability for content',
    'Wir erstellen die Inhalte dieser Website mit größtmöglicher Sorgfalt. Für die Richtigkeit, Vollständigkeit und Aktualität übernehmen wir jedoch keine Gewähr. Antworten des KI-Chatbots werden automatisch erzeugt und können Fehler enthalten; sie sind keine verbindliche Auskunft.': 'We create the content of this website with the greatest possible care. However, we accept no liability for its accuracy, completeness or timeliness. Answers from the AI chatbot are generated automatically and may contain errors; they are not binding information.',
    'Haftung für Links': 'Liability for links',
    'Diese Website enthält gegebenenfalls Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Für diese fremden Inhalte übernehmen wir keine Haftung.': 'This website may contain links to external third-party websites whose content we cannot influence. We accept no liability for such third-party content.',
    'Stand: Oktober 2026': 'Last updated: October 2026',

    // Datenschutz
    'Datenschutz — CloudFlow': 'Privacy — CloudFlow',
    'Datenschutzerklärung von CloudFlow: Chatbot, Kundenkonto und Website.': 'CloudFlow privacy policy: chatbot, customer account and website.',
    'So gehen wir mit deinen Daten um — kurz und verständlich': 'How we handle your data — short and clear',
    'Gelb markierte Felder bitte ausfüllen und die Angaben zu den Diensten (Region, Auftragsverarbeitung) prüfen. Diese Vorlage ersetzt keine Rechtsberatung.': 'Please fill in the fields marked in yellow and check the details on the services (region, data processing agreements). This template is not legal advice.',
    '1. Verantwortlicher': '1. Controller',
    '2. Besuch dieser Website': '2. Visiting this website',
    'Diese Website wird über GitHub Pages (GitHub Inc., USA) bereitgestellt. Beim Aufruf verarbeitet der Hosting-Anbieter technisch notwendige Daten wie deine IP-Adresse, Datum und Uhrzeit sowie die aufgerufene Seite (Server-Logs). Rechtsgrundlage ist unser berechtigtes Interesse an einem sicheren und stabilen Betrieb (Art. 6 Abs. 1 lit. f DSGVO).': 'This website is hosted on GitHub Pages (GitHub Inc., USA). When you visit it, the hosting provider processes technically necessary data such as your IP address, date and time, and the page requested (server logs). The legal basis is our legitimate interest in secure and stable operation (Art. 6(1)(f) GDPR).',
    'Die verwendete Schriftart (Open Sans) wird von unserem eigenen Server geladen — es gibt keine Verbindung zu Google Fonts. Wir setzen': 'The font used (Open Sans) is loaded from our own server — there is no connection to Google Fonts. We use',
    'keine Tracking- oder Analyse-Cookies': 'no tracking or analytics cookies',
    'ein.': 'at all.',
    '3. Chatbot': '3. Chatbot',
    'Wenn du mit dem Chatbot schreibst, wird deine Nachricht samt dem bisherigen Gesprächsverlauf an unsere Server (Supabase, Datenbank und Funktionen) und von dort zur Beantwortung an die KI-Schnittstelle von Anthropic (Claude, USA) übermittelt. Die Antwort wird automatisch erzeugt und kann Fehler enthalten.': 'When you chat with the chatbot, your message and the conversation so far are sent to our servers (Supabase, database and functions) and from there to the AI interface of Anthropic (Claude, USA) to generate a reply. The reply is generated automatically and may contain errors.',
    'Bitte gib im Chat keine sensiblen Daten (z. B. Gesundheits- oder Zahlungsdaten) ein. Zum Schutz vor Missbrauch speichern wir zu jeder Anfrage Zeitpunkt, die Kennung des Chatbots und einen gekürzten, nicht rückrechenbaren Hash deiner IP-Adresse. Der Inhalt deiner Nachrichten wird von uns nicht dauerhaft gespeichert. Rechtsgrundlage: berechtigtes Interesse an Betrieb und Schutz des Dienstes (Art. 6 Abs. 1 lit. f DSGVO). Die Protokolle werden nach 90 Tagen automatisch gelöscht.': 'Please do not enter sensitive data (e.g. health or payment data) in the chat. To prevent abuse, we store the time of each request, the chatbot ID and a truncated, non-reversible hash of your IP address. We do not permanently store the content of your messages. Legal basis: legitimate interest in operating and protecting the service (Art. 6(1)(f) GDPR). The logs are deleted automatically after 90 days.',
    'Wenn du über den Chatbot einen Terminwunsch äußerst, werden die dabei genannten Angaben (Name, Wunschtermin, Leistung und ggf. Telefonnummer oder E-Mail) per E-Mail an das jeweilige Unternehmen weitergeleitet. Den Versand übernimmt der E-Mail-Dienst Resend (Resend Inc., USA). Rechtsgrundlage: Vertragsanbahnung (Art. 6 Abs. 1 lit. b DSGVO).': 'If you make an appointment request via the chatbot, the details you give (name, preferred date, service and, if provided, phone number or email) are forwarded by email to the business concerned. The email service Resend (Resend Inc., USA) handles the sending. Legal basis: pre-contractual measures (Art. 6(1)(b) GDPR).',
    'Auf Websites unserer Kunden gilt zusätzlich die Datenschutzerklärung des jeweiligen Website-Betreibers.': "On our customers' websites, the privacy policy of the respective website operator also applies.",
    '4. Kundenkonto und Dashboard': '4. Customer account and dashboard',
    'Wenn wir dich als Kunden einladen und du dein Konto im Kunden-Login einrichtest, speichern wir deine E-Mail-Adresse, ein verschlüsseltes Passwort (Hash), deine Firmenbezeichnung, das gewählte Paket sowie die von dir hochgeladenen PDF-Dokumente samt dem daraus gelesenen Text, damit dein Chatbot darauf antworten kann. Die Daten liegen bei Supabase': 'If we invite you as a customer and you set up your account via the customer login, we store your email address, an encrypted password (hash), your company name, the chosen plan and the PDF documents you upload together with the text read from them, so that your chatbot can answer based on them. The data is stored with Supabase',
    '. Rechtsgrundlage ist die Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO). Im Browser wird dafür eine Anmelde-Sitzung lokal gespeichert (Local Storage); sie ist technisch notwendig. Alle Programmbibliotheken des Dashboards werden von dieser Website selbst geladen, nicht von fremden Servern.': '. The legal basis is the performance of a contract (Art. 6(1)(b) GDPR). For this, a login session is stored locally in your browser (local storage); it is technically necessary. All program libraries of the dashboard are loaded from this website itself, not from third-party servers.',
    '5. Kontaktaufnahme': '5. Contacting us',
    'Wenn du uns per E-Mail schreibst, verarbeiten wir deine Angaben zur Bearbeitung der Anfrage und für den Fall von Folgefragen. Rechtsgrundlage: Vertragsanbahnung bzw. berechtigtes Interesse (Art. 6 Abs. 1 lit. b und f DSGVO).': 'If you email us, we process your details to handle your enquiry and in case of follow-up questions. Legal basis: pre-contractual measures or legitimate interest (Art. 6(1)(b) and (f) GDPR).',
    '6. Empfänger und Drittländer': '6. Recipients and third countries',
    'Empfänger sind unsere Dienstleister: GitHub (Hosting), Supabase (Datenbank, Anmeldung, Funktionen), Anthropic (KI-Antworten) und Resend (Versand von E-Mails, z. B. Terminanfragen und Einladungen). Dabei kann es zu einer Übermittlung in die USA kommen; sie stützt sich auf die jeweiligen Standardvertragsklauseln bzw. das EU-US Data Privacy Framework.': 'Recipients are our service providers: GitHub (hosting), Supabase (database, login, functions), Anthropic (AI replies) and Resend (sending emails, e.g. appointment requests and invitations). This may involve a transfer to the USA, based on the respective standard contractual clauses or the EU-US Data Privacy Framework.',
    '7. Speicherdauer': '7. Storage period',
    'Kontodaten und Dokumente speichern wir, solange dein Konto besteht. Löschst du ein Dokument im Dashboard, wird es entfernt. Auf Wunsch löschen wir dein gesamtes Konto.': 'We store account data and documents for as long as your account exists. If you delete a document in the dashboard, it is removed. On request we delete your entire account.',
    '8. Deine Rechte': '8. Your rights',
    'Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch. Schreib uns dazu einfach an': 'You have the right to access, rectification, erasure, restriction of processing, data portability and objection. Just write to us at',
    '. Außerdem kannst du dich bei der österreichischen Datenschutzbehörde beschweren:': '. You can also lodge a complaint with the Austrian Data Protection Authority:',

    // 404
    'Seite nicht gefunden — CloudFlow': 'Page not found — CloudFlow',
    'Diese Seite wurde nicht gefunden.': 'This page was not found.',
    'Seite nicht gefunden': 'Page not found',
    'Die Seite gibt es nicht (mehr) — vielleicht hat sich ein Tippfehler eingeschlichen.': 'This page does not exist (anymore) — maybe there is a typo.',
    'Hier geht es weiter:': 'Continue here:',
    'Zur Startseite': 'Go to home page',
    'Zu den Produkten': 'Go to products'
  };

  // Texte mit Zahlen (Preise, Paketname), die Skripte zusammensetzen
  var P = [
    [/^(\d+),(\d\d) ?€$/, '€$1.$2'],
    [/^(\d+) ?€$/, '€$1'],
    [/^(\d+),(\d\d) € pro Monat$/, '€$1.$2 per month'],
    [/^\+ einmalig (\d+) € Einrichtung durch uns$/, '+ one-time €$1 setup by us'],
    [/^nur (\d+) € Einrichtung bei Jahreszahlung$/, 'only €$1 setup with annual billing'],
    [/^Paket (\w+)$/, '$1 plan'],
    [/^(\w+) — Paket-Details — CloudFlow$/, '$1 — Plan details — CloudFlow'],
    [/^oder (\d+) € pro Jahr \(20 % sparen\) · bis zu (\d+) Dokumente · einmalig (\d+) € Einrichtung \(bei Jahreszahlung gratis\)$/,
      'or €$1 per year (save 20%) · up to $2 documents · one-time €$3 setup (free with annual billing)'],
    [/^Einrichtung durch uns: Dokumente, Design und Einbau auf deiner Website \(einmalig (\d+) €, bei Jahreszahlung gratis\)$/,
      'Setup by us: documents, design and installation on your website (one-time €$1, free with annual billing)']
  ];

  function tr(s){
    var k = s.replace(/\s+/g, ' ').trim();
    if(!k) return null;
    if(Object.prototype.hasOwnProperty.call(T, k)) return T[k];
    for(var i = 0; i < P.length; i++){ if(P[i][0].test(k)) return k.replace(P[i][0], P[i][1]); }
    return null;
  }
  window.CF_T = function(s){ var r = tr(s); return r == null ? s : r; };

  var ATTRS = ['placeholder', 'aria-label', 'title', 'alt', 'data-q'];
  var SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, NOSCRIPT: 1, svg: 1 };

  function textNode(n){
    var p = n.parentNode;
    if(!p || SKIP[p.nodeName]) return;
    // Was Besucher selbst in den Chat schreiben, bleibt unverändert
    if(p.closest && p.closest('.cf-msg.user, [translate="no"]')) return;
    var v = n.nodeValue, r = tr(v);
    if(r == null) return;
    var out = v.match(/^\s*/)[0] + r + v.match(/\s*$/)[0];
    if(out !== v) n.nodeValue = out;
  }
  function element(el){
    if(SKIP[el.nodeName] && el.nodeName !== 'TEXTAREA') return;
    ATTRS.forEach(function(a){
      if(!el.hasAttribute(a)) return;
      var r = tr(el.getAttribute(a));
      if(r != null && r !== el.getAttribute(a)) el.setAttribute(a, r);
    });
  }
  function walk(root){
    if(root.nodeType === 3){ textNode(root); return; }
    if(root.nodeType !== 1) return;
    element(root);
    var els = root.querySelectorAll('*');
    for(var i = 0; i < els.length; i++) element(els[i]);
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), n, list = [];
    while((n = w.nextNode())) list.push(n);
    list.forEach(textNode);
  }

  // Seite erst zeigen, wenn sie übersetzt ist (höchstens 1,5 s warten)
  var root = document.documentElement;
  root.lang = 'en';
  root.classList.add('i18n-wait');
  var hideCss = document.createElement('style');
  hideCss.textContent = 'html.i18n-wait body{visibility:hidden}';
  document.head.appendChild(hideCss);
  function reveal(){ root.classList.remove('i18n-wait'); }
  setTimeout(reveal, 1500);

  function translateTitle(){ var r = tr(document.title); if(r != null && r !== document.title) document.title = r; }

  document.addEventListener('DOMContentLoaded', function(){
    try{
      translateTitle();
      document.querySelectorAll('meta[name="description"], meta[property="og:title"], meta[property="og:description"]').forEach(function(m){
        var r = tr(m.getAttribute('content') || ''); if(r != null) m.setAttribute('content', r);
      });
      walk(document.body);
      addSwitch();
      new MutationObserver(function(muts){
        muts.forEach(function(m){
          if(m.type === 'characterData') textNode(m.target);
          else if(m.type === 'attributes') element(m.target);
          else m.addedNodes.forEach(walk);
        });
        translateTitle();
      }).observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
    }catch(e){ console.error('i18n:', e); }
    reveal();
  });
})();
