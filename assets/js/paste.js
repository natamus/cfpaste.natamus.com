$(document).ready(function(e) {
	const queryString = window.location.search;
	const urlParams = new URLSearchParams(queryString);

	const content = urlParams.get('content');
	const filename = urlParams.get('filename');
	const raw = urlParams.get('raw');
	let israw = raw === "true";

	if (content == null) {
		if (israw) {
			displayFileNotFound(true);
			$("#viewrawfile img").attr('src', '/assets/images/header/formatted.svg');
		}
		else {
			displayFileNotFound(false);
			$("#viewrawfile img").attr('src', '/assets/images/header/raw.svg');
		}

		$("#viewrawfile").attr('href', '#');
		$("#dlfile").attr('href', '#');
		return;
	}

	$("#dlfile").attr('href', "https://cdn.discordapp.com/attachments/" + content.replace("_", "/") + "/" + filename);
	if (raw !== "true") {

		$("#viewrawfile").attr('href', '/paste?content=' + content + '&filename=' + filename + '&raw=true');
		$("#viewrawfile img").attr('src', '/assets/images/header/raw.svg');
		loadPasteData(content, filename, false);
	}
	else {
		$("#viewrawfile").attr('href', '/paste?content=' + content + '&filename=' + filename + '&raw=false');
		$("#viewrawfile img").attr('src', '/assets/images/header/formatted.svg');
		loadPasteData(content, filename, true);
	}

	if (/Mobi|Android/i.test(navigator.userAgent)) {
		$(".toggletooltipdiv").hide();
	}

	loadHeaderSettings(true, israw);
});

$(document).on('mousedown', 'tr', function(e) {
	let number = $(this).children('.hljs-ln-line').attr('data-line-number');
	let fullurl = window.location.href;
	let url = fullurl.substring(0, fullurl.lastIndexOf("#"));

	$("tr.selected").removeClass("selected");
	$(this).addClass("selected");

	window.history.replaceState(null, document.title, url + "#" + number);
});

$(document).on('mousedown', '#scrollimg,#nexterrorimg', function(e) {
	let scrollimg = $(this);
	let id = scrollimg.attr('id');
	let src = scrollimg.attr('src');
	if (src.includes("loading")) {
		return;
	}

	if (id === "scrollimg") {
		let rows = $(".content table tr");
		if (src.includes("_disabled")) {
			$("html, body").animate({scrollTop: 0}, "slow");
			src = src.replace("_disabled.svg", ".svg");
		} else {
			let lastrow = $(rows.get(rows.length - 1));
			$("html, body").animate({scrollTop: lastrow.position().top-getRowOffset()}, "slow");
			src = src.replace(".svg", "_disabled.svg");
		}

		scrollimg.attr('src', src);
	}
	else if (id === "nexterrorimg") {
		let selectedrow = $("tr.selected");

		let rows = $(".content table tr");
		if (selectedrow.length === 0) {
			$(rows.get(0)).addClass("selected");
		}

		let passedselected = false;
		rows.each(function(e) {
			let row = $(this);
			if (row.hasClass("selected")) {
				passedselected = true;
				return true;
			}

			if (passedselected) {
				let html = row.html();
				if (html.includes('<span class="error">')) {
					$("tr.selected").removeClass("selected");
					row.addClass("selected");
					$("html, body").animate({scrollTop: row.position().top-getRowOffset()}, "slow");
					return false;
				}
			}
		});
	}
});

const tooltipdescriptions = { "download" : "Download file", "raw" : "View raw file", "pinheader" : "Pin header to top of screen", "wraptext" : "Wrap text to fit screen", "darkmode" : "Toggle dark/light mode", "toggletooltip" : "Toggle header image tooltip visibility", "scroll" : "Scroll to bottom/top", "nexterror" : "Scroll to the next error line" };
$(".header img").on({
    mouseenter: function () {
		if (!$("body").hasClass("toggletooltip") || /Mobi|Android/i.test(navigator.userAgent)) {
			return;
		}

		let id = $(this).attr('id').replace("img", "");
		let description = tooltipdescriptions[id];

		if (id === "raw" && $("body").hasClass("raw")) {
			description = description.replace("raw", "formatted");
		}

		$(".tooltip p").html(description);
        $(".tooltip").show();
    },
    mouseleave: function () {
		if (!$("body").hasClass("toggletooltip")) {
			return;
		}

        $(".tooltip").hide();
    }
});

$(document).mousemove(function(e) {
	if (!$("body").hasClass("toggletooltip")) {
		return;
	}

	let x = e.pageX+10;
	let y = (e.pageY+10) - $(document).scrollTop();
	$(".tooltip").css('top', y + 'px').css('left', x + 'px');
});

function loadPasteData(content, filename, israw) {
	console.log("loadPasteData")
	console.log(content)
	console.log(filename)

	$.ajax({
		url: getUrlPrefix() + content + "/" + filename,
		type: "GET",
		dataType: 'text',
		success: function(content) {
			console.log(content)
		},
		error: function(data) {
			displayFileNotFound(israw);
		}
	});
}

function doExtraProcessing(count, identifier) {

}

function setMaxWidthLineNumbers() {

}

function displayFileNotFound(israw) {
	$(".loadspinner").hide();

	let notfoundcontent = '<div class="notfound"><pre><p>File not available.</p><p>Paste files are kept for up to 7 days with your privacy in mind.</p></pre></div>';
	if (israw) {
		$("body").addClass("raw");
		$(".content").html('<div id="rawframe">' + notfoundcontent + '</div>');
	}
	else {
		$(".content").html(notfoundcontent);
	}
}

/* Header Functions */
$(document).on('change', '.header input', function() {
	let inputelem = $(this);
	let id = inputelem.attr('id');
	if (id === "scroll" || id === "nexterror") {
		return;
	}

	let checked = inputelem.is(":checked");
	if (id === "toggletooltip" && !checked) {
		if ($(".tooltip").is(":visible")) {
			$(".tooltip").hide();
		}
	}

	let israw = $("body").hasClass("raw");
	let cookieprefix = "";
	if (israw) {
		cookieprefix = "raw_";
	}

	Cookies.set(cookieprefix + id, checked, { expires: 365, secure: true, sameSite: 'lax' });
	loadHeaderSettings(false, israw);
});

function loadHeaderSettings(initial, israw) {
	let cookieprefix = "";
	if (israw) {
		cookieprefix = "raw_";
	}

	$(".header input").each(function(e) {
		let inputelem = $(this);
		let id = inputelem.attr('id');
		if (id === "scroll" || id === "nexterror") {
			return true;
		}

		let imgname = inputelem.attr('value');
		let checked = Cookies.get(cookieprefix + id) !== 'false';

		let src = '/assets/images/header/' + imgname + '.svg';
		if (!checked) {
			src = src.replace(".svg", "_disabled.svg");
			$("body").removeClass(id);

			if (id === "wraptext" && !initial && !israw) {
				$(".pastewrapper pre table").addClass("maxwidth");
			}
		}
		else {
			if (!(id === "wraptext" && initial && !israw)) {
				$("body").addClass(id);
			}

			if (id === "wraptext" && !initial && !israw) {
				$(".pastewrapper pre table").removeClass("maxwidth");
			}
		}
		$("#" + id + "img").attr('src', src);

		inputelem.prop('checked', checked);

		if (!initial) {
			Cookies.set(cookieprefix + id, checked, {expires: 365, secure: true, sameSite: 'lax'});
		}
	});
}

/* Utility Functions */
function getUrlPrefix() {
	return atob("aHR0cHM6Ly9jZG4ubW9kdWxhcml0eS5nZy9wYXN0ZS8=");
}

function getRowOffset() {
	if ($("body").hasClass("pinheader")) {
		return 52;
	}
	return 0;
}

function isNumeric(value) {
	return /^\d+$/.test(value);
}

function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
 }