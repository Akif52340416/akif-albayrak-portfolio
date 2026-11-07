(function () {
  "use strict";
  // NL / EN for the pages without a switch of their own: Home, Work and the
  // three case studies. /about, /experience and /contact keep their own
  // switch (each takes the NL · EN link while it is open); everywhere else
  // this script takes it, so the link never navigates (it used to follow its
  // href "#lang" and land on Home) and the choice ("akif-lang") is the same
  // on every page, also after moving between pages. It runs last, so on a
  // page change it has the final word on <html lang>.
  // Dutch stays in the markup; the English is matched per text fragment
  // (and per alt / aria-label) below, so no markup had to change.
  var KEY = 'akif-lang';
  var OWN = ['#/about', '#/experience', '#/contact'];
  var ROOTS = ['homeView', 'workView', 'vdhView', 'uniteView', 'taliaView'];

  var EN = {
    // ---- Home ----
    'Software Development · IT — Nederland · 2026': 'Software Development · IT — The Netherlands · 2026',
    'Hier begon het voor mij.': 'This is where it started for me.',
    'Tijdens mijn eerste stages werkte ik vooral met werkplekken, hardware en IT-support. Problemen oplossen en gebruikers helpen was mijn eerste echte ervaring binnen IT.': 'During my first internships I mainly worked with workstations, hardware and IT support. Solving problems and helping users was my first real experience in IT.',
    'Daarna wilde ik zelf dingen gaan bouwen.': 'Then I wanted to start building things myself.',
    'Tijdens mijn opleiding Software Development ben ik steeds meer gaan programmeren en websites en applicaties gaan maken.': 'During my Software Development course I started programming more and more, and building websites and applications.',
    'Niet alles draait om wat je aan de voorkant ziet.': "Not everything is about what you see on the front end.",
    'Tijdens mijn stage bij ADC werkte ik met Python en SQL om gegevens van machines te verzamelen en te verwerken.': 'During my internship at ADC I worked with Python and SQL to collect and process data from machines.',
    'Nu kijk ik ook naar hoe dingen beter kunnen.': 'Now I also look at how things can be done better.',
    'Bij Baril kijk ik naar IT-processen die slimmer of makkelijker kunnen en onderzoek ik waar automatisering kan helpen.': 'At Baril I look at IT processes that could be smarter or simpler, and research where automation can help.',
    'Uitgelicht werk': 'Featured work',
    'Bekijk al het werk': 'View all work',
    'OVER MIJ': 'ABOUT ME',
    'LATEN WE PRATEN': "LET'S TALK",
    'OPLEIDING': 'EDUCATION',
    'NU': 'NOW',
    'Waar ik meer over wil leren': 'What I want to learn more about',
    'SYSTEMEN': 'SYSTEMS',
    'AUTOMATISERING': 'AUTOMATION',
    'Nog veel te leren.': 'Still plenty to learn.',
    'Website voor een fitness- en boksschool in Waalwijk.': 'Website for a fitness and boxing school in Waalwijk.',
    'Website voor re-integratiecoaching in Waalwijk en omgeving.': 'Website for reintegration coaching in and around Waalwijk.',
    'Website voor een make-up artist uit Drunen.': 'Website for a make-up artist from Drunen.',
    // ---- Work ----
    'Geselecteerd werk': 'Selected work',
    'Fitness- en boksschool — Waalwijk': 'Fitness and boxing school — Waalwijk',
    'Re-integratiecoaching — Waalwijk e.o.': 'Reintegration coaching — Waalwijk area',
    '03 projecten': '03 projects',
    'Bekijk case': 'View case',
    '← Terug naar home': '← Back to home',
    // ---- case studies: shared ----
    'Zelfde identiteit.': 'Same identity.',
    'Elk apparaat.': 'Every device.',
    'Tekst en acties': 'Text and actions',
    'eerst.': 'first.',
    'Aangepast,': 'Adapted,',
    'niet verkleind.': 'not shrunk.',
    'Focus': 'Focus',
    'Sector': 'Sector',
    'Schermen': 'Screens',
    'Desktop · Tablet · Mobiel': 'Desktop · Tablet · Mobile',
    'Mobiel': 'Mobile',
    'Ontwerprichting': 'Design direction',
    'Gebruikservaring': 'User experience',
    'Resultaat': 'Result',
    'Fotografie': 'Photography',
    'Typografie': 'Typography',
    'Kleuren uit de homepage': 'Colours from the homepage',
    // ---- Van der Hammen Gym ----
    'Fitness- en boksschool': 'Fitness and boxing school',
    'Voor Van der Hammen Gym heb ik een nieuwe website ontwikkeld die past bij de uitstraling van de sportschool.': 'For Van der Hammen Gym I developed a new website that matches the character of the gym.',
    "Het doel was om een moderne en krachtige website te maken waarop bezoekers snel informatie kunnen vinden over de sportschool, trainingen en mogelijkheden om zich aan te melden. De website bestaat uit negen pagina's, is beschikbaar in het Nederlands en Engels en bevat een koppeling met het bestaande boekingssysteem.": 'The goal was a modern, powerful website where visitors can quickly find information about the gym, its training sessions and how to sign up. The website has nine pages, is available in Dutch and English and links to the existing booking system.',
    'Rol': 'Role',
    'Technieken': 'Technologies',
    'Responsive design · Gebruiksvriendelijkheid · Boekingsintegratie · Meertalig': 'Responsive design · Usability · Booking integration · Multilingual',
    'Omvang': 'Scope',
    "Negen pagina's · Nederlands & Engels": 'Nine pages · Dutch & English',
    'De uitdaging': 'The challenge',
    'Van der Hammen Gym heeft een duidelijke eigen identiteit. Die uitstraling wilde ik ook online herkenbaar maken.': 'Van der Hammen Gym has a clear identity of its own. I wanted to make that character recognisable online too.',
    'De website moest niet alleen visueel bij de sportschool passen, maar ook praktisch zijn. Bezoekers moeten eenvoudig trainingen kunnen bekijken, informatie kunnen vinden en vanuit de website verder kunnen naar het boekingssysteem.': 'The website had to fit the gym visually, but also be practical. Visitors should be able to browse training sessions, find information and continue from the website to the booking system with ease.',
    'Daarnaast moest de website goed werken op verschillende schermformaten en in zowel het Nederlands als Engels beschikbaar zijn.': 'It also had to work well on different screen sizes and be available in both Dutch and English.',
    'De website is ontworpen voor desktop, tablet en mobiel.': 'The website is designed for desktop, tablet and mobile.',
    'Op ieder formaat blijft dezelfde identiteit herkenbaar, terwijl de indeling wordt aangepast aan het apparaat. Hierdoor blijft de belangrijkste informatie duidelijk zichtbaar en bruikbaar, ongeacht het scherm waarop de website wordt bezocht.': 'On every size the same identity stays recognisable, while the layout adapts to the device. That keeps the most important information clearly visible and usable, whatever screen the website is visited on.',
    'Mijn rol': 'My role',
    'Binnen dit project heb ik gewerkt aan zowel het ontwerp als de ontwikkeling van de website.': 'In this project I worked on both the design and the development of the website.',
    "Ik heb nagedacht over de structuur van de pagina's, de visuele uitstraling en hoe bezoekers door de website navigeren. Vervolgens heb ik het ontwerp uitgewerkt tot een responsive website met HTML, CSS en JavaScript.": 'I thought about the structure of the pages, the visual style and how visitors move through the website. I then turned the design into a responsive website with HTML, CSS and JavaScript.',
    'Tijdens de ontwikkeling heb ik de website op verschillende schermformaten getest en waar nodig aanpassingen gemaakt.': 'During development I tested the website on different screen sizes and made adjustments where needed.',
    'Structuur': 'Structure',
    "Opbouw van de pagina's": 'How the pages are built',
    'Uitstraling': 'Look & feel',
    'Visuele stijl en navigatie': 'Visual style and navigation',
    'HTML, CSS en JavaScript': 'HTML, CSS and JavaScript',
    'Testen': 'Testing',
    'Verschillende schermformaten': 'Different screen sizes',
    'Ontwerp': 'Design',
    'Voor het ontwerp heb ik gekozen voor een donkere en krachtige uitstraling die past bij fitness en boksen.': 'For the design I chose a dark, powerful look that suits fitness and boxing.',
    "Grote foto's spelen een belangrijke rol in het ontwerp en geven bezoekers direct een beeld van de sportschool. De duidelijke typografie zorgt ervoor dat belangrijke teksten snel opvallen.": 'Large photos play an important role in the design and immediately give visitors a picture of the gym. The clear typography makes important text stand out quickly.',
    'Goudkleurige accenten': 'Gold accents',
    'Goudkleurige accenten worden gebruikt voor belangrijke onderdelen, zoals knoppen en kleine details. Hierdoor ontstaat contrast met de donkere achtergrond en blijft de uitstraling herkenbaar door de hele website.': 'Gold accents are used for important elements, such as buttons and small details. This creates contrast with the dark background and keeps the look recognisable throughout the website.',
    'Donker': 'Dark',
    'Goud': 'Gold',
    'Desktop, tablet en mobiel zijn niet simpelweg kleinere versies': 'Desktop, tablet and mobile are not simply smaller versions',
    'van elkaar.': 'of each other.',
    'De website is ontwikkeld met HTML, CSS en JavaScript en is volledig responsive opgebouwd.': 'The website is built with HTML, CSS and JavaScript and is fully responsive.',
    'Desktop, tablet en mobiel zijn niet simpelweg kleinere versies van elkaar. De indeling past zich aan het beschikbare scherm aan. Navigatie, tekst, afbeeldingen en knoppen veranderen waar nodig van positie en formaat.': 'Desktop, tablet and mobile are not simply smaller versions of each other. The layout adapts to the available screen. Navigation, text, images and buttons change position and size where needed.',
    'Tijdens het ontwikkelen heb ik verschillende schermformaten getest en onderdelen aangepast wanneer de gebruikerservaring niet goed genoeg werkte.': "While developing, I tested different screen sizes and adjusted parts whenever the user experience didn't work well enough.",
    'Taalkeuze en inschrijfknop — header': 'Language switch and sign-up button — header',
    'Sportschool & trainingen': 'Gym & training sessions',
    'Actie': 'Action',
    'Boeken of aanmelden': 'Book or sign up',
    'Extern': 'External',
    'Bestaand boekingssysteem': 'Existing booking system',
    'Boekingsintegratie': 'Booking integration',
    'Een belangrijk onderdeel van de website is de mogelijkheid om vanuit de website verder te gaan naar het bestaande boekingssysteem.': 'An important part of the website is the option to continue from the website to the existing booking system.',
    'Hierdoor kan de website zich richten op het presenteren van de sportschool en de trainingen, terwijl bezoekers vanuit dezelfde ervaring eenvoudig verder kunnen naar het boeken of aanmelden.': 'That way the website can focus on presenting the gym and its training sessions, while visitors can easily move on to booking or signing up from the same experience.',
    "Pagina's": 'Pages',
    'Talen — NL · EN': 'Languages — NL · EN',
    'Schermformaten': 'Screen sizes',
    "Het eindresultaat is een website van negen pagina's waarin de identiteit van Van der Hammen Gym centraal staat.": 'The end result is a nine-page website with the identity of Van der Hammen Gym at its centre.',
    'De combinatie van een donkere uitstraling, fotografie, duidelijke navigatie, twee talen en de boekingsmogelijkheid zorgt voor een website die niet alleen visueel bij de sportschool past, maar ook praktisch te gebruiken is.': 'The combination of a dark look, photography, clear navigation, two languages and the booking option makes a website that not only fits the gym visually, but is also practical to use.',
    'Wat ik heb geleerd': 'What I learned',
    'Dit project heeft mij vooral meer ervaring gegeven met het uitwerken van een groter websiteproject.': 'Above all, this project gave me more experience in working out a larger website project.',
    "Ik heb geleerd om niet alleen naar één pagina te kijken, maar ervoor te zorgen dat meerdere pagina's samen één consistente website vormen. Daarnaast heb ik meer ervaring opgedaan met responsive development, het testen van verschillende schermformaten en het verwerken van een extern boekingssysteem in een website.": 'I learned not to look at one page at a time, but to make sure several pages together form one consistent website. I also gained more experience with responsive development, testing different screen sizes and working an external booking system into a website.',
    'Volgend project — 01': 'Next project — 01',
    'Volgend project — 02': 'Next project — 02',
    // ---- Unite Re-integratie ----
    'Voor Unite Re-integratie heb ik gewerkt aan een website waarbij duidelijkheid en toegankelijkheid centraal staan.': 'For Unite Re-integratie I worked on a website built around clarity and accessibility.',
    'De website presenteert de dienstverlening op een rustige en professionele manier en helpt bezoekers om snel de juiste informatie te vinden.': 'The website presents the services in a calm, professional way and helps visitors find the right information quickly.',
    'De interface is ontworpen voor verschillende schermformaten, waarbij desktop, tablet en mobiel ieder een passende indeling krijgen.': 'The interface is designed for different screen sizes, with desktop, tablet and mobile each getting a fitting layout.',
    'Re-integratiebegeleiding': 'Reintegration support',
    'Regio': 'Region',
    'Waalwijk e.o.': 'Waalwijk area',
    'Duidelijkheid · Toegankelijkheid': 'Clarity · Accessibility',
    'Hero — koptekst en accent': 'Hero — heading and accent',
    'Voor de visuele stijl is gekozen voor een combinatie van donkerblauw, wit en groene accenten.': 'The visual style combines dark blue, white and green accents.',
    'Donkerblauw': 'Dark blue',
    'Wit': 'White',
    'Groen': 'Green',
    'Het donkerblauw vormt de basis van de hero, terwijl het groen belangrijke woorden en kleine elementen benadrukt. Grote typografie zorgt ervoor dat de belangrijkste boodschap direct zichtbaar is.': 'Dark blue forms the base of the hero, while green highlights key words and small elements. Large typography makes sure the main message is visible right away.',
    'Fotografie neemt op grotere schermen een prominente plaats in. Hierdoor wordt de pagina persoonlijker zonder dat de tekst aan duidelijkheid verliest.': 'On larger screens photography takes a prominent place. This makes the page more personal without the text losing clarity.',
    'Op desktop bestaat de hero uit twee duidelijke delen: content aan de linkerkant en fotografie aan de rechterkant.': 'On desktop the hero has two clear parts: content on the left and photography on the right.',
    'Op tablet blijft deze verdeling grotendeels herkenbaar, maar worden de verhoudingen aangepast aan de beschikbare ruimte.': 'On tablet this split stays largely recognisable, but the proportions adapt to the available space.',
    'Op mobiel verandert de structuur sterker. De navigatie wordt vereenvoudigd naar een mobiel menu en de belangrijkste tekst en call-to-actions krijgen voorrang. Hierdoor blijft de pagina overzichtelijk op een veel smaller scherm.': 'On mobile the structure changes more. The navigation is simplified into a mobile menu, and the main text and calls to action take priority. That keeps the page clear on a much narrower screen.',
    'De belangrijkste boodschap staat direct centraal: bezoekers moeten snel kunnen begrijpen wat Unite Re-integratie aanbiedt en wat hun volgende stap kan zijn.': 'The main message comes first: visitors should quickly understand what Unite Re-integratie offers and what their next step could be.',
    'Hero — call-to-actions': 'Hero — calls to action',
    'Daarom zijn de belangrijkste acties duidelijk zichtbaar, waaronder het plannen van een gesprek en het bekijken van de diensten.': "That's why the key actions are clearly visible, including scheduling a conversation and viewing the services.",
    'Het resultaat is een rustige en professionele interface waarin informatie, fotografie en duidelijke call-to-actions samenkomen.': 'The result is a calm, professional interface where information, photography and clear calls to action come together.',
    'De responsive uitwerking zorgt ervoor dat de belangrijkste inhoud ook op kleinere schermen overzichtelijk blijft.': 'The responsive build keeps the most important content clear on smaller screens too.',
    'Volgend project — 03': 'Next project — 03',
    // ---- Talia ----
    'Voor Talia heb ik gewerkt aan een websiteconcept waarin make-up, fotografie en een rustige uitstraling centraal staan.': 'For Talia I worked on a website concept built around make-up, photography and a calm look.',
    'In plaats van veel verschillende visuele elementen ligt de nadruk op grote fotografie, typografie en ruimte. Hierdoor krijgt het werk zelf de aandacht en blijft de interface rustig.': 'Instead of many different visual elements, the focus is on large photography, typography and space. That puts the attention on the work itself and keeps the interface calm.',
    'Websiteconcept': 'Website concept',
    'Fotografie · Typografie · Ruimte': 'Photography · Typography · Space',
    'Licht · Warm · Serif': 'Light · Warm · Serif',
    'Hero — serif-koptekst': 'Hero — serif heading',
    'De website gebruikt een lichte, warme achtergrond in combinatie met grote fotografie.': 'The website uses a light, warm background combined with large photography.',
    'Voor de belangrijkste koppen wordt een elegante serif-typografie gebruikt. Dit geeft de website een heel ander karakter dan mijn andere projecten en sluit aan bij de beauty- en make-upwereld.': 'The main headings use an elegant serif typeface. This gives the website a very different character from my other projects and suits the world of beauty and make-up.',
    'De interface gebruikt bewust weinig kleuren en decoratieve elementen. Hierdoor blijven de fotografie en inhoud het belangrijkste onderdeel van de pagina.': 'The interface deliberately uses few colours and decorative elements. That keeps the photography and content the most important part of the page.',
    'Warm wit': 'Warm white',
    'Inkt': 'Ink',
    'Knop': 'Button',
    'Op desktop is de hero verdeeld in twee grote delen. De tekst staat links en de fotografie neemt de rechterkant van het scherm in.': 'On desktop the hero is split into two large parts. The text sits on the left and the photography takes up the right side of the screen.',
    'Op tablet blijft deze verdeling zichtbaar, maar wordt de content smaller zodat beide onderdelen voldoende ruimte behouden.': 'On tablet this split stays visible, but the content gets narrower so both parts keep enough room.',
    'Op mobiel verandert de compositie. De grote afbeelding krijgt eerst ruimte en de tekst volgt daaronder. Hierdoor wordt het ontwerp niet simpelweg verkleind, maar daadwerkelijk aangepast aan het kleinere scherm.': "On mobile the composition changes. The large image gets room first and the text follows below it. So the design isn't simply scaled down, but actually adapted to the smaller screen.",
    'De belangrijkste acties zijn bewust eenvoudig gehouden. Vanuit de hero kan een bezoeker bijvoorbeeld verder naar een afspraak of het portfolio.': 'The key actions are deliberately kept simple. From the hero, a visitor can go on to an appointment or the portfolio, for example.',
    'Door weinig elementen tegelijk te tonen, blijft de aandacht bij de content en wordt de gebruiker niet overspoeld met informatie.': "By showing only a few elements at a time, attention stays on the content and the visitor isn't flooded with information.",
    'Het resultaat is een lichte, rustige websitepresentatie waarin fotografie en typografie de visuele identiteit bepalen.': 'The result is a light, calm website presentation in which photography and typography define the visual identity.',
    'Door de verschillende responsive layouts blijft die uitstraling behouden op desktop, tablet en mobiel.': 'Thanks to the different responsive layouts, that look holds up on desktop, tablet and mobile.',
    // ---- shortened versions (less content, same meaning) ----
    'OPLEIDING — NU': 'EDUCATION — NOW',
    'De uitdaging: de sportschool heeft een duidelijke eigen identiteit, die ook online herkenbaar moest zijn. Tegelijk moest de site praktisch zijn: trainingen bekijken, informatie vinden en doorgaan naar het bestaande boekingssysteem, op elk scherm en in het Nederlands en Engels.': 'The challenge: the gym has a clear identity of its own, which had to be recognisable online too. At the same time the site had to be practical: viewing training sessions, finding information and moving on to the existing booking system, on every screen and in Dutch and English.',
    'Desktop, tablet en mobiel zijn geen kleinere versies van elkaar: navigatie, tekst, beelden en knoppen veranderen per scherm van positie en formaat.': "Desktop, tablet and mobile aren't smaller copies of each other: navigation, text, images and buttons change position and size per screen.",
    "Ik heb de structuur van de pagina's, de visuele stijl en de navigatie bedacht en het ontwerp uitgewerkt tot een responsive website met HTML, CSS en JavaScript. Tijdens het bouwen heb ik op verschillende schermformaten getest en bijgestuurd waar de gebruikerservaring tekortschoot.": 'I worked out the page structure, the visual style and the navigation, then built the design into a responsive website with HTML, CSS and JavaScript. While building, I tested on different screen sizes and adjusted wherever the user experience fell short.',
    "Grote foto's laten direct de sportschool zien; duidelijke typografie laat belangrijke tekst snel opvallen.": 'Large photos show the gym right away; clear typography makes important text stand out.',
    'Goudkleurige accenten op knoppen en details geven contrast met de donkere achtergrond en houden de stijl herkenbaar.': 'Gold accents on buttons and details contrast with the dark background and keep the style recognisable.',
    'Vanuit de website gaan bezoekers door naar het bestaande boekingssysteem. Zo richt de website zich op het presenteren van de sportschool en de trainingen, en blijft boeken of aanmelden één stap verder.': 'From the website, visitors continue to the existing booking system. That way the website focuses on presenting the gym and its training sessions, and booking or signing up stays one step away.',
    "Ik heb geleerd om meerdere pagina's als één consistente website te ontwerpen, en om een extern boekingssysteem in een website te verwerken.": 'I learned to design several pages as one consistent website, and to work an external booking system into a website.',
    'Content links, fotografie rechts.': 'Content on the left, photography on the right.',
    'Dezelfde verdeling, met verhoudingen die passen bij de ruimte.': 'The same split, with proportions that fit the space.',
    'Een mobiel menu; tekst en call-to-actions krijgen voorrang.': 'A mobile menu; text and calls to action come first.',
    'Weinig kleuren en decoratie, zodat fotografie en inhoud het belangrijkste blijven.': 'Few colours and little decoration, so photography and content stay the main thing.',
    'Tekst links, fotografie rechts.': 'Text on the left, photography on the right.',
    'Dezelfde verdeling, met smallere content.': 'The same split, with narrower content.',
    'Eerst de grote afbeelding, daaronder de tekst: aangepast, niet verkleind.': 'The large image first, the text below it: adapted, not scaled down.',
    'Alle projecten': 'All projects',
    'Terug naar': 'Back to'
  };
  // alt texts and aria-labels
  var ATTR = {
    'Akif Albayrak, buiten aan het water bij zonsondergang': 'Akif Albayrak, outside by the water at sunset',
    'Van der Hammen Gym website — mobiel': 'Van der Hammen Gym website — mobile',
    'Unite Re-integratie website — mobiel': 'Unite Re-integratie website — mobile',
    'Glam_ByTalia website — mobiel': 'Glam_ByTalia website — mobile',
    'Van der Hammen Gym website — desktop weergave': 'Van der Hammen Gym website — desktop view',
    'Van der Hammen Gym website — tablet weergave': 'Van der Hammen Gym website — tablet view',
    'Van der Hammen Gym website — mobiele weergave': 'Van der Hammen Gym website — mobile view',
    'Unite Re-integratie website — desktop weergave': 'Unite Re-integratie website — desktop view',
    'Unite Re-integratie website — tablet weergave': 'Unite Re-integratie website — tablet view',
    'Unite Re-integratie website — mobiele weergave': 'Unite Re-integratie website — mobile view',
    'Glam_ByTalia website — desktop weergave': 'Glam_ByTalia website — desktop view',
    'Glam_ByTalia website — tablet weergave': 'Glam_ByTalia website — tablet view',
    'Glam_ByTalia website — mobiele weergave': 'Glam_ByTalia website — mobile view',
    'Werkwijze': 'Process',
    'Detail van de homepage: fotografie, koptekst en goudkleurige knoppen': 'Homepage detail: photography, heading and gold buttons',
    "Taalkeuze NL / EN en de knop 'Schrijf je in' in de header van de website": "The NL / EN language switch and the 'Schrijf je in' (sign up) button in the website's header",
    'Van website naar boekingssysteem': 'From website to booking system',
    'Volgend project': 'Next project',
    'Detail van de homepage: grote koptekst met groene accentwoorden op donkerblauw': 'Homepage detail: large heading with green accent words on dark blue',
    'Kleuren uit de homepage': 'Colours from the homepage',
    "De knoppen 'Plan een gesprek' en 'Onze diensten' in de hero": "The 'Plan een gesprek' (schedule a conversation) and 'Onze diensten' (our services) buttons in the hero",
    "Detail van de homepage: serif-koptekst 'Professionele make-up met oog voor detail.'": "Homepage detail: serif heading 'Professionele make-up met oog voor detail.' (professional make-up with an eye for detail)",
    "De knoppen 'Boek Afspraak' en 'Bekijk Portfolio' in de hero": "The 'Boek Afspraak' (book appointment) and 'Bekijk Portfolio' (view portfolio) buttons in the hero",
    'Terug naar Work': 'Back to Work'
  };

  function norm(s) { return s.replace(/\s+/g, ' ').trim(); }
  var texts = [], attrs = [];
  ROOTS.forEach(function (id) {
    var root = document.getElementById(id);
    if (!root) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), node;
    while ((node = walker.nextNode())) {
      var key = norm(node.nodeValue);
      if (!key || !Object.prototype.hasOwnProperty.call(EN, key) || EN[key] === key) continue;
      var lead = node.nodeValue.match(/^\s*/)[0], trail = node.nodeValue.match(/\s*$/)[0];
      texts.push({ node: node, nl: node.nodeValue, en: lead + EN[key] + trail });
    }
    [].forEach.call(root.querySelectorAll('[alt], [aria-label]'), function (el) {
      ['alt', 'aria-label'].forEach(function (a) {
        var v = el.getAttribute(a);
        if (v && Object.prototype.hasOwnProperty.call(ATTR, v)) attrs.push({ el: el, attr: a, nl: v, en: ATTR[v] });
      });
    });
  });

  function saved() { try { return window.localStorage.getItem(KEY) === 'en' ? 'en' : 'nl'; } catch (e) { return 'nl'; } }
  function own() { return OWN.indexOf(window.location.hash || '') > -1; }
  var lang = null;

  function apply() {
    var l = saved();
    if (l !== lang) {
      lang = l;
      texts.forEach(function (t) { t.node.nodeValue = lang === 'en' ? t.en : t.nl; });
      attrs.forEach(function (a) { a.el.setAttribute(a.attr, lang === 'en' ? a.en : a.nl); });
    }
    if (!own()) document.documentElement.lang = lang;
  }

  document.addEventListener('click', function (e) {
    var link = e.target.closest && e.target.closest('.nav .lang');
    if (!link) return;
    e.preventDefault();               // never follow "#lang"
    if (own()) return;                // /about, /experience, /contact switch themselves
    try { window.localStorage.setItem(KEY, saved() === 'en' ? 'nl' : 'en'); } catch (err) {}
    apply();
    document.dispatchEvent(new CustomEvent('akif:langchange'));
  });
  // a choice made on /about, /experience or /contact is picked up on the way back
  window.addEventListener('hashchange', apply);
  window.addEventListener('pageshow', apply);
  apply();
})();
