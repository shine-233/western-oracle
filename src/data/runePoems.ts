/**
 * 三首卢恩诗对照（盎格鲁-撒克逊 8-9c / 挪威 c.13c / 冰岛 c.15c），
 * 英译 Bruce Dickins 1915（公版）。由 research/pipeline 自动生成，请勿手改。
 */
export type PoemLang = 'anglo_saxon' | 'norwegian' | 'icelandic'

export interface RunePoemEntry {
  original: string
  translation: string
  source: string
}

export interface RunePoems {
  rune: string
  poems: Partial<Record<PoemLang, RunePoemEntry>>
}

export const RUNE_POEMS: RunePoems[] = [
  { rune: 'Kenaz', poems: {
    anglo_saxon: { original: 'Cen byþ cwicera gehwam, cuþ on fyre blac ond beorhtlic, byrneþ oftust ðær hi æþelingas inne restaþ.', translation: 'C. (the torch) is known to every living man by its pale, bright flame; it always burns where princes sit within.', source: 'Anglo-Saxon Rune Poem (8-9c), trans. Bruce Dickins 1915' },
    norwegian: { original: 'Kaun er barna bǫlvan; bǫl gørver nán fǫlvan.', translation: 'Kaun — Ulcer is fatal to children; death makes a corpse pale.', source: 'Norwegian Rune Poem (c. 13c), trans. Bruce Dickins 1915' },
    icelandic: { original: 'Kaun er barna böl ok bardaga för ok holdfúa hús, flagella konungr.', translation: 'Kaun — Ulcer: disease fatal to children, and painful spot, and abode of mortification.', source: 'Icelandic Rune Poem (c. 15c), trans. Bruce Dickins 1915' },
  }},
  { rune: 'Laguz', poems: {
    anglo_saxon: { original: 'Lagu byþ leodum langsum geþuht, gif hi sculun neþan on nacan tealtum and hi sæyþa swyþe bregaþ and se brimhengest bridles ne gymeð.', translation: 'L. (the ocean) seems interminable to men, if they venture on the rolling bark and the waves of the sea terrify them and the courser of the deep heed not its bridle.', source: 'Anglo-Saxon Rune Poem (8-9c), trans. Bruce Dickins 1915' },
    norwegian: { original: 'Lǫgr er, fællr ór fjalle foss; en gull ero nosser.', translation: 'Logr — A waterfall is a river which falls from a mountain-side; but ornaments are of gold.', source: 'Norwegian Rune Poem (c. 13c), trans. Bruce Dickins 1915' },
    icelandic: { original: 'Lögr er vellanda vatn ok viðr ketill ok glömmungr grund, lacus lofðungr.', translation: 'Lögr — Water: eddying stream, and broad geysir, and land of the fish.', source: 'Icelandic Rune Poem (c. 15c), trans. Bruce Dickins 1915' },
  }},
  { rune: 'Isa', poems: {
    anglo_saxon: { original: 'Is byþ ofereald, ungemetum slidor, glisnaþ glæshluttur gimmum gelicust, flor forste geworuht, fæger ansyne.', translation: 'I. (ice) is very cold and immeasurably slippery; it glistens as clear as glass and most like to gems; it is a floor wrought by the frost, fair to look upon.', source: 'Anglo-Saxon Rune Poem (8-9c), trans. Bruce Dickins 1915' },
    norwegian: { original: 'Ís kǫllum brú bræiða; blindan þarf at læiða.', translation: 'Isa — Ice we call the broad bridge; the blind man must be led.', source: 'Norwegian Rune Poem (c. 13c), trans. Bruce Dickins 1915' },
    icelandic: { original: 'Íss er árbörkr ok unnar þak ok feigra manna fár, glacies jöfurr.', translation: 'Iss — Ice: bark of rivers, and roof of the wave, and destruction of the doomed.', source: 'Icelandic Rune Poem (c. 15c), trans. Bruce Dickins 1915' },
  }},
  { rune: 'Thurisaz', poems: {
    anglo_saxon: { original: 'Ðorn byþ ðearle scearp; ðegna gehwylcum anfeng ys yfyl, ungemetum reþe manna gehwelcum, ðe him mid resteð.', translation: 'Þ. (the thorn) is exceedingly sharp, an evil thing for any knight to touch, uncommonly severe on all who sit among them.', source: 'Anglo-Saxon Rune Poem (8-9c), trans. Bruce Dickins 1915' },
    norwegian: { original: 'Þurs vældr kvinna kvillu; kátr værðr fár af illu.', translation: 'Thurs — Giant causes anguish to women; misfortune makes few men cheerful.', source: 'Norwegian Rune Poem (c. 13c), trans. Bruce Dickins 1915' },
    icelandic: { original: 'Þurs er kvenna kvöl ok kletta búi ok varðrúnar verr, Saturnus þengill.', translation: 'Thurs — Giant: torture of women, and cliff-dweller, and husband of a giantess.', source: 'Icelandic Rune Poem (c. 15c), trans. Bruce Dickins 1915' },
  }},
  { rune: 'Perthro', poems: {
    anglo_saxon: { original: 'Peorð byþ symble plega and hlehter wlancum [on middum], ðar wigan sittaþ on beorsele bliþe ætsomne.', translation: 'Peorth is a source of recreation and amusement to the great, where warriors sit blithely together in the banqueting-hall.', source: 'Anglo-Saxon Rune Poem (8-9c), trans. Bruce Dickins 1915' },
  }},
  { rune: 'Tiwaz', poems: {
    anglo_saxon: { original: 'Tir biþ tacna sum, healdeð trywa wel wiþ æþelingas; a biþ on færylde ofer nihta genipu, næfre swiceþ.', translation: 'T. (?) is a (guiding) star; well does it keep faith with princes; it is ever on its course over the mists of night and never fails.', source: 'Anglo-Saxon Rune Poem (8-9c), trans. Bruce Dickins 1915' },
    norwegian: { original: 'Týr er æinendr ása; opt værðr smiðr blása.', translation: 'Tyr — Tyr is a one-handed god; often has the smith to blow.', source: 'Norwegian Rune Poem (c. 13c), trans. Bruce Dickins 1915' },
    icelandic: { original: 'Týr er einhendr áss ok ulfs leifar ok hofa hilmir, Mars tiggi.', translation: 'Tyr — Tyr: god with one hand, and leavings of the wolf, and prince of temples.', source: 'Icelandic Rune Poem (c. 15c), trans. Bruce Dickins 1915' },
  }},
  { rune: 'Eihwaz', poems: {
    anglo_saxon: { original: 'Eoh byþ utan unsmeþe treow, heard hrusan fæst, hyrde fyres, wyrtrumun underwreþyd, wyn on eþle.', translation: 'Eoh (the yew) is a tree with rough bark, hard and fast in the earth, supported by its roots, a guardian of flame and a joy upon an estate.', source: 'Anglo-Saxon Rune Poem (8-9c), trans. Bruce Dickins 1915' },
  }},
  { rune: 'Ingwaz', poems: {
    anglo_saxon: { original: 'Ing wæs ærest mid East-Denum gesewen secgun, oþ he siððan est ofer wæg gewat; wæn æfter ran; ðus Heardingas ðone hæle nemdun.', translation: 'Ing was first seen by men among the East-Danes, till, followed by his chariot, he departed eastwards over the waves. So the Heardingas named the hero.', source: 'Anglo-Saxon Rune Poem (8-9c), trans. Bruce Dickins 1915' },
  }},
  { rune: 'Ansuz', poems: {
    anglo_saxon: { original: 'Os byþ ordfruma ælere spræce, wisdomes wraþu ond witena frofur and eorla gehwam eadnys ond tohiht.', translation: 'O. (?) is the source of all language, a pillar of wisdom and a comfort to wise men, a blessing and a joy to every knight.', source: 'Anglo-Saxon Rune Poem (8-9c), trans. Bruce Dickins 1915' },
    norwegian: { original: 'Óss er flæstra færða för; en skalpr er sværða.', translation: 'As — Estuary is the way of most journeys; but a scabbard is of swords.', source: 'Norwegian Rune Poem (c. 13c), trans. Bruce Dickins 1915' },
    icelandic: { original: 'Óss er algingautr ok ásgarðs jöfurr, ok valhallar vísi, Jupiter oddviti.', translation: 'Oss — God: aged Gautr, and prince of Ásgardr, and lord of Vallhalla.', source: 'Icelandic Rune Poem (c. 15c), trans. Bruce Dickins 1915' },
  }},
  { rune: 'Wunjo', poems: {
    anglo_saxon: { original: 'Wenne bruceþ, ðe can weana lyt sares and sorge and him sylfa hæfþ blæd and blysse and eac byrga geniht.', translation: 'W. (bliss) he enjoys who knows not suffering, sorrow nor anxiety, and has prosperity and happiness and a good enough house.', source: 'Anglo-Saxon Rune Poem (8-9c), trans. Bruce Dickins 1915' },
  }},
  { rune: 'Gebo', poems: {
    anglo_saxon: { original: 'Gyfu gumena byþ gleng and herenys, wraþu and wyrþscype and wræcna gehwam ar and ætwist, ðe byþ oþra leas.', translation: 'G. (generosity) brings credit and honour, which support one\'s dignity; it furnishes help and subsistence to all broken men who are devoid of aught else.', source: 'Anglo-Saxon Rune Poem (8-9c), trans. Bruce Dickins 1915' },
  }},
  { rune: 'Fehu', poems: {
    anglo_saxon: { original: 'Feoh byþ frofur fira gehwylcum; sceal ðeah manna gehwylc miclun hyt dælan gif he wile for drihtne domes hleotan.', translation: 'F. (wealth) is a comfort to all men; yet must every man bestow it freely, if he wish to gain honour in the sight of the Lord.', source: 'Anglo-Saxon Rune Poem (8-9c), trans. Bruce Dickins 1915' },
    norwegian: { original: 'Fé vældr frænda róge; føðesk ulfr í skóge.', translation: 'Fe — Wealth is a source of discord among kinsmen; the wolf lives in the forest.', source: 'Norwegian Rune Poem (c. 13c), trans. Bruce Dickins 1915' },
    icelandic: { original: 'Fé er frænda róg ok flæðar viti ok grafseiðs gata, aurum fylkir.', translation: 'Fé — Wealth: source of discord among kinsmen, and fire of the sea, and path of the serpent.', source: 'Icelandic Rune Poem (c. 15c), trans. Bruce Dickins 1915' },
  }},
  { rune: 'Jera', poems: {
    anglo_saxon: { original: 'Ger byþ gumena hiht, ðonne God læteþ, halig heofones cyning, hrusan syllan beorhte bleda beornum ond ðearfum.', translation: 'Ger (summer) is a joy to men, when God, the holy King of Heaven, suffers the earth to bring forth shining fruits for rich and poor alike.', source: 'Anglo-Saxon Rune Poem (8-9c), trans. Bruce Dickins 1915' },
    norwegian: { original: 'Ár er gumna góðe; get ek at ǫrr var Fróðe.', translation: 'Ar — Plenty is a boon to men; I say that Frodi was generous.', source: 'Norwegian Rune Poem (c. 13c), trans. Bruce Dickins 1915' },
    icelandic: { original: 'Ár er gumna góði ok gott sumar, algróinn akr, annus allvaldr.', translation: 'Ar — Plenty: boon to men, and good summer, and thriving crops.', source: 'Icelandic Rune Poem (c. 15c), trans. Bruce Dickins 1915' },
  }},
  { rune: 'Berkano', poems: {
    anglo_saxon: { original: 'Beorc byþ bleda leas, bereþ efne swa ðeah tanas butan tudder, biþ on telgum wlitig, heah on helme hrysted fægere, geloden leafum, lyfte getenge.', translation: 'B. (the poplar) bears no fruit; yet without seed it brings forth suckers, for it is generated from its leaves. Splendid are its branches and gloriously adorned its lofty crown which reaches to the skies.', source: 'Anglo-Saxon Rune Poem (8-9c), trans. Bruce Dickins 1915' },
    norwegian: { original: 'Bjarkan er laufgrønstr líma; Loki bar flærða tíma.', translation: 'Bjarkan — Birch has the greenest leaves of any shrub; Loki was fortunate in his deceit.', source: 'Norwegian Rune Poem (c. 13c), trans. Bruce Dickins 1915' },
    icelandic: { original: 'Bjarkan er laufgat lim ok lítit tré ok ungsamligr viðr, abies buðlungr.', translation: 'Bjarken — Birch: leafy twig, and little tree, and fresh young shrub.', source: 'Icelandic Rune Poem (c. 15c), trans. Bruce Dickins 1915' },
  }},
  { rune: 'Dagaz', poems: {
    anglo_saxon: { original: 'Dæg byþ drihtnes sond, deore mannum, mære metodes leoht, myrgþ and tohiht eadgum and earmum, eallum brice.', translation: 'Dæg (day), the glorious light of the Creator, is sent by the Lord; it is beloved of men, a source of hope and happiness to rich and poor, and of service to all.', source: 'Anglo-Saxon Rune Poem (8-9c), trans. Bruce Dickins 1915' },
  }},
  { rune: 'Sowilo', poems: {
    anglo_saxon: { original: 'Sigel semannum symble biþ on hihte, ðonne hi hine feriaþ ofer fisces beþ, oþ hi brimhengest bringeþ to lande.', translation: 'Sigel (the sun) is ever a joy in the hopes of seafarers when they journey away over the fishes\' bath, until the courser of the deep bears them to land.', source: 'Anglo-Saxon Rune Poem (8-9c), trans. Bruce Dickins 1915' },
    norwegian: { original: 'Sól er landa ljóme; lúti ek helgum dóme.', translation: 'Sol — Sun is the light of the world; I bow to the divine decree.', source: 'Norwegian Rune Poem (c. 13c), trans. Bruce Dickins 1915' },
    icelandic: { original: 'Sól er skýja skjöldr ok skínandi röðull ok ísa aldrtregi, rota siklingr.', translation: 'Sol — Sun: shield of the clouds, and shining ray, and destroyer of ice.', source: 'Icelandic Rune Poem (c. 15c), trans. Bruce Dickins 1915' },
  }},
  { rune: 'Nauthiz', poems: {
    anglo_saxon: { original: 'Nyd byþ nearu on breostan; weorþeþ hi þeah oft niþa bearnum to helpe and to hæle gehwæþre, gif hi his hlystaþ æror.', translation: 'N. (trouble) is oppressive to the heart; yet often it proves a source of help and salvation to the children of men, to everyone who heeds it betimes.', source: 'Anglo-Saxon Rune Poem (8-9c), trans. Bruce Dickins 1915' },
    norwegian: { original: 'Nauðr gerer næppa koste; nøktan kælr í froste.', translation: 'Naudhr — Constraint gives scant choice; a naked man is chilled by the frost.', source: 'Norwegian Rune Poem (c. 13c), trans. Bruce Dickins 1915' },
    icelandic: { original: 'Nauð er Þýjar þrá ok þungr kostr ok vássamlig verk, opera niflungr.', translation: 'Naud — Constraint: grief of the bond-maid, and state of oppression, and toilsome work.', source: 'Icelandic Rune Poem (c. 15c), trans. Bruce Dickins 1915' },
  }},
  { rune: 'Ehwaz', poems: {
    anglo_saxon: { original: 'Eh byþ for eorlum æþelinga wyn, hors hofum wlanc, ðær him hæleþ ymbe welege on wicgum wrixlaþ spræce and biþ unstyllum æfre frofur.', translation: 'E. (the horse) is a joy to princes in the presence of warriors, a steed in the pride of its hoofs, when rich men on horseback bandy words about it; and it is ever a source of comfort to the restless.', source: 'Anglo-Saxon Rune Poem (8-9c), trans. Bruce Dickins 1915' },
  }},
  { rune: 'Mannaz', poems: {
    anglo_saxon: { original: 'Man byþ on myrgþe his magan leof: sceal þeah anra gehwylc oðrum swican, forðum drihten wyle dome sine þæt earme flæsc eorþan betæcan.', translation: 'M. the joyous (man) is dear to his kinsmen; yet every man is doomed to fail his fellow, since the Lord by his decree will commit the vile carrion to the earth.', source: 'Anglo-Saxon Rune Poem (8-9c), trans. Bruce Dickins 1915' },
    norwegian: { original: 'Maðr er moldar auki; mikil er græip á hauki.', translation: 'Madhr — Man is an augmentation of the dust; great is the claw of the hawk.', source: 'Norwegian Rune Poem (c. 13c), trans. Bruce Dickins 1915' },
    icelandic: { original: 'Maðr er manns gaman ok moldar auki ok skipa skreytir, homo mildingr.', translation: 'Madr — Man: delight of man, and augmentation of the earth, and adorner of ships.', source: 'Icelandic Rune Poem (c. 15c), trans. Bruce Dickins 1915' },
  }},
  { rune: 'Hagalaz', poems: {
    anglo_saxon: { original: 'Hægl byþ hwitust corna; hwyrft hit of heofones lyfte, wealcaþ hit windes scura; weorþeþ hit to wætere syððan.', translation: 'H. (hail) is the whitest of grain; it is whirled from the vault of heaven and is tossed about by gusts of wind and then it melts into water.', source: 'Anglo-Saxon Rune Poem (8-9c), trans. Bruce Dickins 1915' },
    norwegian: { original: 'Hagall er kaldastr korna; Kristr skóp hæimenn forna.', translation: 'Hagall — Hail is the coldest of grain; Christ created the world of old.', source: 'Norwegian Rune Poem (c. 13c), trans. Bruce Dickins 1915' },
    icelandic: { original: 'Hagall er kaldakorn ok krapadrífa ok snáka sótt, grando hildingr.', translation: 'Hagall — Hail: cold grain, and shower of sleet, and sickness of serpents.', source: 'Icelandic Rune Poem (c. 15c), trans. Bruce Dickins 1915' },
  }},
  { rune: 'Uruz', poems: {
    anglo_saxon: { original: 'Ur byþ anmod ond oferhyrned, felafrecne deor, feohteþ mid hornum mære morstapa; þæt is modig wuht.', translation: 'U. (the aurochs) is proud and has great horns; it is a very savage beast and fights with its horns; a great ranger of the moors, it is a creature of mettle.', source: 'Anglo-Saxon Rune Poem (8-9c), trans. Bruce Dickins 1915' },
    norwegian: { original: 'Úr er af illu jarne; opt løypr ræinn á hjarne.', translation: 'Ur — Dross comes from bad iron; the reindeer often races over the frozen snow.', source: 'Norwegian Rune Poem (c. 13c), trans. Bruce Dickins 1915' },
    icelandic: { original: 'Úr er skýja grátr ok skára þverrir ok hirðis hatr, umbre vísi.', translation: 'Ur — Shower: lamentation of the clouds, and ruin of the hay-harvest, and abomination of the shepherd.', source: 'Icelandic Rune Poem (c. 15c), trans. Bruce Dickins 1915' },
  }},
  { rune: 'Raidho', poems: {
    anglo_saxon: { original: 'Rad byþ on recyde rinca gehwylcum sefte ond swiþhwæt, ðamðe sitteþ on ufan meare mægenheardum ofer milpaþas.', translation: 'R. (?) seems easy to every warrior while he is indoors and very courageous to him who traverses the highroads on the back of a stout horse.', source: 'Anglo-Saxon Rune Poem (8-9c), trans. Bruce Dickins 1915' },
    norwegian: { original: 'Ræið kveða rossom væsta; Reginn sló sværðet bæzta.', translation: 'Reidh — Riding is said to be the worst thing for horses; Reginn forged the finest sword.', source: 'Norwegian Rune Poem (c. 13c), trans. Bruce Dickins 1915' },
    icelandic: { original: 'Reið er sitjandi sæla ok snúðig ferð ok jórs erfiði, iter ræsir.', translation: 'Reid — Riding: joy of the horsemen, and speedy journey, and toil of the steed.', source: 'Icelandic Rune Poem (c. 15c), trans. Bruce Dickins 1915' },
  }},
  { rune: 'Othala', poems: {
    anglo_saxon: { original: 'Eþel byþ oferleof æghwylcum men, gif he mot ðær rihtes and gerysena on brucan on bolde bleadum oftast.', translation: 'Ethel (an estate) is very dear to every man, if he can enjoy there in his house whatever is right and proper in constant prosperity.', source: 'Anglo-Saxon Rune Poem (8-9c), trans. Bruce Dickins 1915' },
  }},
  { rune: 'Algiz', poems: {
    anglo_saxon: { original: 'Eolh-secg eard hæfþ oftust on fenne wexeð on wature, wundaþ grimme, blode breneð beorna gehwylcne ðe him ænigne onfeng gedeþ.', translation: 'The Eolh-sedge is mostly to be found in a marsh; it grows in the water and makes a ghastly wound, covering with blood every warrior who touches it.', source: 'Anglo-Saxon Rune Poem (8-9c), trans. Bruce Dickins 1915' },
    norwegian: { original: 'Ýr er vetrgrønstr viða; vænt er, er brennr, at sviða.', translation: 'Yr — Yew is the greenest of trees in winter; it is wont to crackle when it burns.', source: 'Norwegian Rune Poem (c. 13c), trans. Bruce Dickins 1915' },
    icelandic: { original: 'Ýr er bendr bogi ok brotgjarnt járn ok fífu fárbauti, arcus ynglingr.', translation: 'Yr — Yew: bent bow, and brittle iron, and giant of the arrow.', source: 'Icelandic Rune Poem (c. 15c), trans. Bruce Dickins 1915' },
  }},
]
