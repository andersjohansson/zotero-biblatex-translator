{
    "translatorID":"ba4cd274-f24e-42cf-8ff2-ccfc603aacf3",
    "translatorType":2,
    "label":"BibLaTeX",
    "creator":"Simon Kornblith, Richard Karnesky and Anders Johansson",
    "target":"bib",
    "minVersion":"2.1.9",
    "maxVersion":"null",
    "priority":100,
    "inRepository":false,
    "configOptions":{"getCollections":"true"},
    "displayOptions": {
		"exportCharset": "UTF-8",
		"exportNotes": false,
		"exportFileData": false,
		"useJournalAbbreviation": false
    },
    "lastUpdated":"2013-07-01 14:13"
}


//%a = first author surname
//%y = year
//%t = first word of title
var citeKeyFormat = "%a_%t_%y";


var fieldMap = {
    location:"place",
    chapter:"chapter",
    edition:"edition",
    title:"title",
    volume:"volume",
    rights:"rights", //it's rights in zotero nowadays
    isbn:"ISBN",
    issn:"ISSN",
    url:"url",
    doi:"DOI",
    shorttitle:"shortTitle",
    abstract:"abstract",
    volumes:"numberOfVolumes",
    version:"version",
    eventtitle:"conferenceName",
    language:"language",
    issue:"issue",
    pages:"pages",
    pagetotal:"numPages"
};
//more conversions done below with special rules


//POTENTIAL ISSUES
//"programTitle", "bookTitle" //TODO, check!!
// 
//	accessDate:"accessDate", //only written on attached webpage snapshots by zo
//	journalAbbreviation:"journalAbbreviation", //not supported by bl

//	country:"country", //TODO if patent, should be put into 'location' 



var zotero2biblatexTypeMap = {
    "book":"book",
    "bookSection":"inbook",
    "journalArticle":"article",
    "magazineArticle":"article",
    "newspaperArticle":"article",
    "thesis":"thesis",
    "letter":"letter",
    "manuscript":"unpublished",
    "interview":"misc",
    "film":"movie",
    "artwork":"artwork",
    "webpage":"online",
    "conferencePaper":"inproceedings",
    "report":"report",
    "bill":"legislation",
    "case":"jurisdiction",
    "hearing":"jurisdiction",
    "patent":"patent",
    "statute":"legislation",
    "email":"letter",
    "map":"misc",
    "blogPost":"online",
    "instantMessage":"misc",
    "forumPost":"online",
    "audioRecording":"audio",
    "presentation":"unpublished",
    "videoRecording":"video",
    "tvBroadcast":"misc",
    "radioBroadcast":"misc",
    "podcast":"audio",
    "computerProgram":"software",
    "document":"misc",
    "encyclopediaArticle":"inreference",
    "dictionaryEntry":"inreference"
};


var alwaysMap = {
	"|":"{\\textbar}",
	"<":"{\\textless}",
	">":"{\\textgreater}",
	"~":"{\\textasciitilde}",
	"^":"{\\textasciicircum}",
	"\\":"{\\textbackslash}",
	"{" : "\\{",
	"}" : "\\}"
};




// some fields are, in fact, macros.  If that is the case then we should not put the
// data in the braces as it will cause the macros to not expand properly
function writeField(field, value, isMacro, noEscape) {
	if(!value && typeof value != "number") return;
	value = value + ""; // convert integers to strings
	Zotero.write(",\n\t" + field + " = ");
	if (!isMacro) Zotero.write("{");
	// url field is preserved, for use with \href and \url
	// Other fields (DOI?) may need similar treatment
	if (!noEscape && !isMacro && !(field == "url" || field == "doi" || field == "file" || field == "lccn")) {
		//var titleCase = isTitleCase(value);	//figure this out before escaping all the characters
		// I hope these are all the escape characters! (except for < > which are handled later)
		value = value.replace(/[|\~\^\\\{\}]/g, mapEscape).replace(/[\#\$\%\&\_]/g, "\\$&");
		//convert the HTML markup allowed in Zotero for rich text to TeX
		value = mapHTMLmarkup(value);
		//escape < > if mapHTMLmarkup did not convert some
		value = value.replace(/[<>]/g, mapEscape);
		
		/*
		if (field == "title" || field == "type" || field == "shorttitle" || field == "booktitle" || field == "series") {
			if (!titleCase) {
				//protect caps for everything but the first letter
					value = value.replace(/(.)([A-Z]+)/g, "$1{$2}");
			} else {	//protect all-caps vords and initials
				value = value.replace(/([\s.->])([A-Z]+)(?=\.)/g, "$1{$2}");	//protect initials
				if(value.toUpperCase() != value) value = value.replace(/([\s>])([A-Z]{2,})(?=[\.,\s<]|$)/g, "$1{$2}");
			}
		}
		*/	
			
		// Case of words with uppercase characters in non-initial positions is preserved with braces.
		// treat hyphen as whitespace for this purpose so that Large-scale etc. don't get enclosed
		// treat curly bracket as whitespace because of mark-up immediately preceding word
		// treat opening parentheses &brackets as whitespace
		if (field != "pages") {
			value = value.replace(/([^\s-\}\(\[]+[A-Z][^\s,]*)/g, "{$1}");
		}
	}
	//we write utf8
	//convert the HTML markup allowed in Zotero for rich text to TeX; excluding doi/url/file shouldn't be necessary, but better to be safe;
	if (!((field == "url") || (field == "doi") || (field == "file"))) value = mapHTMLmarkup(value);
	Zotero.write(value);
	if (!isMacro) Zotero.write("}");
}

function mapHTMLmarkup(characters){
	//converts the HTML markup allowed in Zotero for rich text to TeX
	//since  < and > have already been escaped, we need this rather hideous code - I couldn't see a way around it though.
	//italics and bold
	characters = characters.replace(/\{\\textless\}i\{\\textgreater\}(((?!\{\\textless\}\/i{\\textgreater\}).)+)\{\\textless\}\/i{\\textgreater\}/, "\\textit{$1}").replace(/\{\\textless\}b\{\\textgreater\}(((?!\{\\textless\}\/b{\\textgreater\}).)+)\{\\textless\}\/b{\\textgreater\}/g, "\\textbf{$1}");
	//sub and superscript
	characters = characters.replace(/\{\\textless\}sup\{\\textgreater\}(((?!\{\\textless\}\/sup\{\\textgreater\}).)+)\{\\textless\}\/sup{\\textgreater\}/g, "\$^{\\textrm{$1}}\$").replace(/\{\\textless\}sub\{\\textgreater\}(((?!\{\\textless\}\/sub\{\\textgreater\}).)+)\{\\textless\}\/sub\{\\textgreater\}/g, "\$_{\\textrm{$1}}\$");
	//two variants of small caps
	characters = characters.replace(/\{\\textless\}span\sstyle=\"small\-caps\"\{\\textgreater\}(((?!\{\\textless\}\/span\{\\textgreater\}).)+)\{\\textless\}\/span{\\textgreater\}/g, "\\textsc{$1}").replace(/\{\\textless\}sc\{\\textgreater\}(((?!\{\\textless\}\/sc\{\\textgreater\}).)+)\{\\textless\}\/sc\{\\textgreater\}/g, "\\textsc{$1}");
	return characters;
}


//Disable the isTitleCase function until we decide what to do with it.
/* const skipWords = ["but", "or", "yet", "so", "for", "and", "nor",
	"a", "an", "the", "at", "by", "from", "in", "into", "of", "on",
	"to", "with", "up", "down", "as", "while", "aboard", "about",
	"above", "across", "after", "against", "along", "amid", "among",
	"anti", "around", "as", "before", "behind", "below", "beneath",
	"beside", "besides", "between", "beyond", "but", "despite",
	"down", "during", "except", "for", "inside", "like", "near",
	"off", "onto", "over", "past", "per", "plus", "round", "save",
	"since", "than", "through", "toward", "towards", "under",
	"underneath", "unlike", "until", "upon", "versus", "via",
	"within", "without"];

function isTitleCase(string) {
	const wordRE = /[\s[(]([^\s,\.:?!\])]+)/g;

	var word;
	while (word = wordRE.exec(string)) {
		word = word[1];
		if(word.search(/\d/) != -1	//ignore words with numbers (including just numbers)
			|| skipWords.indexOf(word.toLowerCase()) != -1) {
			continue;
		}

		if(word.toLowerCase() == word) return false;
	}
	return true;
}
*/

function mapEscape(character) {
	return alwaysMap[character];
}


// a little substitution function for BibTeX keys, where we don't want LaTeX 
// escaping, but we do want to preserve the base characters

function tidyAccents(s) {
	var r=s.toLowerCase();

	// XXX Remove conditional when we drop Zotero 2.1.x support
	// This is supported in Zotero 3.0 and higher
	if (ZU.removeDiacritics !== undefined)
		r = ZU.removeDiacritics(r, true);
	else {
	// We fall back on the replacement list we used previously
		r = r.replace(new RegExp("[ä]", 'g'),"ae");
		r = r.replace(new RegExp("[ö]", 'g'),"oe");
		r = r.replace(new RegExp("[ü]", 'g'),"ue");
		r = r.replace(new RegExp("[àáâãå]", 'g'),"a");
		r = r.replace(new RegExp("æ", 'g'),"ae");
		r = r.replace(new RegExp("ç", 'g'),"c");
		r = r.replace(new RegExp("[èéêë]", 'g'),"e");
		r = r.replace(new RegExp("[ìíîï]", 'g'),"i");
		r = r.replace(new RegExp("ñ", 'g'),"n");                            
		r = r.replace(new RegExp("[òóôõ]", 'g'),"o");
		r = r.replace(new RegExp("œ", 'g'),"oe");
		r = r.replace(new RegExp("[ùúû]", 'g'),"u");
		r = r.replace(new RegExp("[ýÿ]", 'g'),"y");
	}

	return r;
};

var numberRe = /^[0-9]+/;
// Below is a list of words that should not appear as part of the citation key
// in includes the indefinite articles of English, German, French and Spanish, as well as a small set of English prepositions whose 
// force is more grammatical than lexical, i.e. which are likely to strike many as 'insignificant'.
// The assumption is that most who want a title word in their key would prefer the first word of significance.
var citeKeyTitleBannedRe = /\b(a|an|the|some|from|on|in|to|of|do|with|der|die|das|ein|eine|einer|eines|einem|einen|un|une|la|le|l\'|el|las|los|al|uno|una|unos|unas|de|des|del|d\')(\s+|\b)/g;
var citeKeyConversionsRe = /%([a-zA-Z])/;
var citeKeyCleanRe = /[^a-z0-9\!\$\&\*\+\-\.\/\:\;\<\>\?\[\]\^\_\`\|]+/g;

var citeKeyConversions = {
	"a":function (flags, item) {
		if(item.creators && item.creators[0] && item.creators[0].lastName) {
			return item.creators[0].lastName.toLowerCase().replace(/ /g,"_").replace(/,/g,"");
		}
		return "";
	},
	"t":function (flags, item) {
		if (item["title"]) {
			return item["title"].toLowerCase().replace(citeKeyTitleBannedRe, "").split(/\s+/g)[0];
		}
		return "";
	},
	"y":function (flags, item) {
		if(item.date) {
			var date = Zotero.Utilities.strToDate(item.date);
			if(date.year && numberRe.test(date.year)) {
				return date.year;
			}
		}
		return "????";
	}
}


function buildCiteKey (item,citekeys) {
    var basekey = "";
    var counter = 0;
    citeKeyFormatRemaining = citeKeyFormat;
    while (citeKeyConversionsRe.test(citeKeyFormatRemaining)) {
        if (counter > 100) {
            Zotero.debug("Pathological BibTeX format: " + citeKeyFormat);
            break;
        }
        var m = citeKeyFormatRemaining.match(citeKeyConversionsRe);
        if (m.index > 0) {
            //add data before the conversion match to basekey
            basekey = basekey + citeKeyFormatRemaining.substr(0, m.index);
        }
        var flags = ""; // for now
        var f = citeKeyConversions[m[1]];
        if (typeof(f) == "function") {
            var value = f(flags, item);
            Zotero.debug("Got value " + value + " for %" + m[1]);
            //add conversion to basekey
            basekey = basekey + value;
        }
        citeKeyFormatRemaining = citeKeyFormatRemaining.substr(m.index + m.length);
        counter++;
    }
    if (citeKeyFormatRemaining.length > 0) {
        basekey = basekey + citeKeyFormatRemaining;
    }

    // for now, remove any characters not explicitly known to be allowed;
    // we might want to allow UTF-8 citation keys in the future, depending
    // on implementation support.
    //
    // no matter what, we want to make sure we exclude
    // " # % ' ( ) , = { } ~ and backslash
    // however, we want to keep the base characters 

    basekey = tidyAccents(basekey);
    basekey = basekey.replace(citeKeyCleanRe, "");
    var citekey = basekey;
    var i = 0;
    while(citekeys[citekey]) {
        i++;
        citekey = basekey + "-" + i;
    }
    citekeys[citekey] = true;
    return citekey;
}

function doExport() {
    //Zotero.write("% biblatex export generated by Zotero "+Zotero.Utilities.getVersion());
    // to make sure the BOM gets ignored
    Zotero.write("\n");
    
    var first = true;
    var citekeys = new Object();
    var item;
    while(item = Zotero.nextItem()) {
		//don't export standalone notes and attachments
		if(item.itemType == "note" || item.itemType == "attachment") continue;

	// determine type
	var type = zotero2biblatexTypeMap[item.itemType];
	if (typeof(type) == "function") { type = type(item); }
	if(!type) type = "misc";
	

        //If you want a custom citekey: just use
        //"biblatexcitekey[mycitekey] in the Extra field
        var citekey = "";
        if (item.extra && item.extra.search(/biblatexcitekey\[.+\]/) != -1) {
            var citekey = item.extra.match(/biblatexcitekey\[(.+)\]/)[1]; 
        }
	if(!citekey) {
	    // create a unique citation key
	    citekey = buildCiteKey(item, citekeys);
	}

	// write citation key (removed the comma)
	Zotero.write((first ? "" : "\n\n") + "@"+type+"{"+citekey);
	first = false;
	
	for(var field in fieldMap) {
	    if(item[fieldMap[field]]) {
		writeField(field, item[fieldMap[field]]);
	    }
	}

	// Fields needing special treatment and not easily translatable via fieldMap
	//e.g. where fieldname translation is dependent upon type, or special transformations
	//has to be made

	//all kinds of numbers (biblatex has additional support for journal number != issue, but zotero has not)
	if(item.reportNumber || item.seriesNumber || item.patentNumber || item.billNumber || item.episodeNumber || item.number) {
	    writeField("number", item.reportNumber || item.seriesNumber || item.patentNumber || item.billNumber || item.episodeNumber|| item.number);
	}


	if(item.publicationTitle) {
	    if(item.itemType == "bookSection" || item.itemType == "conferencePaper") {
		writeField("booktitle", item.publicationTitle); 
	    } else if (item.itemType == "magazineArticle" || item.itemType == "newspaperArticle"){
                writeField("journaltitle", item.publicationTitle);
	    } else if (item.itemType == "journalArticle") {
                if(Zotero.getOption("useJournalAbbreviation")){
		    writeField("journal", item.journalAbbreviation);
                } else {
                    writeField("journaltitle", item.publicationTitle);
                    writeField("shortjournal", item.journalAbbreviation);
                }
            }

	   // else if (item.itemType == "website" || item.itemType == "forumPost" || item.itemType == "blogPost" || item.itemType == "tvBroadcast" || item.itemType == "radioBroadcast") {
	//	writeField("titleaddon", item.publicationTitle);
	// 
		//do nothing as websiteTitle, forumTitle, blogTitle,
		//programTitle seems
		//to be just aliases for publicationTitle and already
		//are correctly mapped below
//	    }
	    else { 
		//writeField("journaltitle", item.publicationTitle);
		//TODO, did we miss something
	    }
	}
	

    //TODO: check what happens to bookTitle, is that also an alias for publicationTitle?

	
	if(item.encyclopediaTitle || item.dictionaryTitle || item.proceedingsTitle) {
	    writeField("booktitle",item.encyclopediaTitle || item.dictionaryTitle || item.proceedingsTitle);
	}

	if(item.websiteTitle || item.forumTitle || item.blogTitle || item.programTitle) {
	    writeField("titleaddon", item.websiteTitle || item.forumTitle || item.blogTitle || item.programTitle);
	}
	
	//don't really know if this is the best way
	if(item.seriesTitle) {
	    writeField("series",item.seriesTitle);
	} else if(item.series) {
	    writeField("series",item.series);
	}

	
	if(item.publisher) {
	    if(item.itemType == "thesis") {
		writeField("school", item.publisher); //school is an acceptable alias in biblatex
	    } else if(item.itemType =="report") {
		writeField("institution", item.publisher);
	    } else {
		writeField("publisher", item.publisher);
	    }
	}
	
	//things concerning "type"
	if(item.itemType == "letter"){
	    if(item.letterType){
		writeField("type",item.letterType);
	    } else {
		writeField("type","Letter"); //this isn't optimal, perhaps later versions of biblatex will add some suitable localization key
	    }
	} else if(item.itemType == "email"){
	    writeField("type", "E-mail");
	} else if(item.manuscriptType || item.thesisType || item.websiteType || item.presentationType || item.reportType || item.mapType) {
	    writeField("type", item.manuscriptType || item.thesisType || item.websiteType || item.presentationType || item.reportType || item.mapType);
	}

	if(item.presentationType || item.manuscriptType){
	    writeField("howpublished", item.presentationType || item.manuscriptType);
	}

	//case of specific eprint-archives in archive-fields
	if(item.archive && item.archiveLocation) {
	    if(item.archive == "arXiv" || item.archive == "arxiv") {
		writeField("eprinttype", "arxiv");
		writeField("eprint", item.archiveLocation);
		if(item.callNumber) {//assume call number is used for arxiv class
		    writeField("eprintclass", item.callNumber)
		}
	    } else if(item.archive = "JSTOR" || item.archive == "jstor") {
		writeField("eprinttype", "jstor");
		writeField("eprint", item.archiveLocation);
	    } else if(item.archive = "PubMed" || item.archive == "pubmed") {
		writeField("eprinttype", "pubmed");
		writeField("eprint", item.archiveLocation);
	    } else if(item.archive = "HDL" || item.archive == "hdl") {
		writeField("eprinttype", "hdl");
		writeField("eprint", item.archiveLocation);
	    } else if(item.archive = "googlebooks" || item.archive == "Google Books") {
		writeField("eprinttype", "googlebooks");
		writeField("eprint", item.archiveLocation);
	    }
	}

	
	if(item.creators && item.creators.length) {
	    // split creators into subcategories
	    var author = "";
	    var bookauthor = "";
	    var commentator = "";
	    var editor = "";
	    var editora = "";
	    var editorb = "";
	    var holder = "";
	    var translator = "";
	    var noEscape = false;

	    for each(var creator in item.creators) {
		//var creatorString = creator.lastName;
		
		if (creator.firstName && creator.lastName) {
		    creatorString = creator.lastName + ", " + creator.firstName;
		//below to preserve possible corporate creators (biblatex 1.4a manual 2.3.3)
		} else if (creator.fieldMode == true) { // fieldMode true, assume corporate author
		    creatorString = "{" + creator.lastName + "}"; noEscape = true;
		}

		if (creator.creatorType == "author" || creator.creatorType == "interviewer" || creator.creatorType == "director" || creator.creatorType == "programmer" || creator.creatorType == "artist" || creator.creatorType == "podcaster" || creator.creatorType == "presenter") {
		    author += " and "+creatorString;
		} else if (creator.creatorType == "bookAuthor") {
		    bookauthor += " and "+creatorString;
		} else if (creator.creatorType == "commenter") {
		    commentator += " and "+creatorString;
		} else if (creator.creatorType == "editor") {
		    editor += " and "+creatorString;
		} else if (creator.creatorType == "inventor") {
		    holder += " and "+creatorString;
		} else if (creator.creatorType == "translator") {
		    translator += " and "+creatorString;
		} else if (creator.creatorType == "seriesEditor") {//let's call them redacors
		    editorb = +" and "+creatorString;
		} else {// the rest into editora with editoratype = collaborator
		    editora += " and "+creatorString;
		}
	    }
	    
	    //remove first " and " string
	    if(author) {
		writeField("author", author.substr(5), false, noEscape);
	    }
	    if(bookauthor) {
		writeField("bookauthor", bookauthor.substr(5), false, noEscape);
	    }
	    if(commentator) {
		writeField("commentator", commenter.substr(5), false, noEscape); 
	    }
	    if(editor) {
		writeField("editor", editor.substr(5), false, noEscape);
	    }
	    if(editora) {
		writeField("editora", editora.substr(5), false, noEscape);
		writeField("editoratype", "collaborator");
	    }
	    if(editorb) {
		writeField("editorb", editorb.substr(5), false, noEscape);
		writeField("editorbtype", "redactor");
	    }
	    if(holder) {
		writeField("holder", holder.substr(5), false, noEscape);
	    }
	    if(translator) {
		writeField("translator", translator.substr(5), false, noEscape);
	    }


	}

	
	if(item.accessDate){
            writeField("urldate", Zotero.Utilities.strToISO(item.accessDate));
        }

	//TODO enable handling of date ranges when that's added to zotero
	if(item.date) {
	    writeField("date",Zotero.Utilities.strToISO(item.date));
	}
	
	
	if(item.extra) {
	    // this is for extracting fields not available in Zotero that one want's to use
	    // in BibLaTex. Add the data in Zotero's 'extra' field e.g. like this and it
	    // will be extracted:
	    // biblatexdata[chapter=3;origyear=1909]
	    if(item.extra.match("biblatexdata")){
		var ex = item.extra.replace(/^.*biblatexdata\[|\].*$/g,"");
		var blf = ex.split(";");
		for each(var pair in blf){
		    var ps=pair.split("=",2);
		    writeField(ps[0],ps[1]);
		}

	    } else{
		writeField("note", item.extra);
	    }

	}
	
	if(item.tags && item.tags.length) {
	    var tagString = "";
	    for each(var tag in item.tags) {
		tagString += ", "+tag.tag;
	    }
	    writeField("keywords", tagString.substr(2));
	}
	
	
	if (item.notes && Zotero.getOption("exportNotes")) {
	    for(var i in item.notes) {
		var note = item.notes[i];
		writeField("annote", Zotero.Utilities.unescapeHTML(note["note"]));
	    }
	}
	
	if(item.attachments) {
	    var attachmentString = "";
	    
	    for(var i in item.attachments) {
		var attachment = item.attachments[i];
		if(Zotero.getOption("exportFileData") && attachment.saveFile) {
		    attachment.saveFile(attachment.defaultPath, true);
		    attachmentString += ";" + attachment.title + ":" + attachment.defaultPath + ":" + attachment.mimeType;
		} else if(attachment.localPath) {
		    attachmentString += ";" + attachment.title + ":" + attachment.localPath + ":" + attachment.mimeType;
		}
	    }
	    
	    if(attachmentString) {
		writeField("file", attachmentString.substr(1));
	    }
	}
	
	Zotero.write("\n}");
    }
}
