/**
 * Prefix for each field line under a component in the report.
 */
let REPORT_FIELD_PREFIX = " • ";

/**
 * Constants for units of measurement used in fields.
 */
let UNITS_PLUS_MINUS = "±";
let UNITS_MICROFARADS = "µF";
let UNITS_DEGREES = "°F";
let UNITS_AMPS = "a";
let UNITS_VOLTS = "v";
let UNITS_MICROAMPS = "µa";
let UNITS_PSIG = "PSIG";
let UNITS_INCHES_WATERCOLUMN = "\" WC";


/**
 * Browsers localStorage used to store components data and activeIndex.
 */
var storage = window.localStorage;

/**
 * Array of objects used to store information about Condensors,
 * Furnaces, FAUs and coils of systems.
 */
var components = [];

/**
 * Index of component in components array that is currently
 * being displayed. This is stored so that refreshing the page keeps the
 * user on the same component.
 */
var activeIndex = 0;

/**
 * Default data for a component when new-button is clicked. 
 */
function newComponent() {
    return {
        'type': 'New',
        'activeTab': 'info-tab'
    };
}

/**
 * Formats data for a single field for report.
 */
function reportField(label, field, units="", newline=true) {
    if (!field) {
        return "";
    }
    let reportText = REPORT_FIELD_PREFIX + label + ": " + field + units;
    if (newline) {
        return reportText + "\n";
    }
    return reportText;
}

/**
 * Formats data for a field that has a rated field for a report.
 */
function reportFieldRated(label, field, rated, units="", newline=true) {
    if (!field) {
        return "";
    }
    var reportText = reportField(label, field, units, false);
    if (rated) {
        reportText += " rated " + rated + units;
    }
    if (newline) {
        reportText += "\n";
    }
    return reportText;
}

/**
 * Formats data for the fields associated with a capacitor for a report.
 */
function reportCapacitor(label, field, rated, plusMinus, newline=true) {
    if (!field) {
        return "";
    }
    var reportText = reportFieldRated(label + " Cap", field, rated, UNITS_MICROFARADS, false);
    if (rated && plusMinus) {
        reportText += " " + UNITS_PLUS_MINUS + plusMinus + "%";
    }
    if (newline) {
        reportText += "\n";
    }
    return reportText;
}

/**
 * Formats data for the fields associated with refrigerant readings for a report.
 */
function reportRefrigerant(label, field, target, pressure, newline=true) {
    if (!field) {
        return "";
    }
    var reportText = REPORT_FIELD_PREFIX + label + ": " + field + UNITS_DEGREES;
    if (pressure) {
        reportText += " @ " + pressure + UNITS_PSIG;
    }
    if (target) {
        reportText += " (target " + label + " " + target + UNITS_DEGREES + ")";
    }
    if (newline) {
        reportText += "\n";
    }
    return reportText;
}

/**
 * Helper to generate text related to a Condensor component.
 */
function generateCondensorReport(component) {
    var reportText = "";

    // ELECTRICAL
    reportText += reportFieldRated("FLA", component.fla, component.flaRated, UNITS_AMPS);
    reportText += reportFieldRated("RLA", component.rla, component.rlaRated, UNITS_AMPS);
    reportText += reportFieldRated("LRA", component.lra, component.lraRated, UNITS_AMPS);
    reportText += reportField("Electrical Notes", component.electricalNotes);
    // REFRIGERANT
    reportText += reportField("Metering Device", component.meteringDevice);
    reportText += reportRefrigerant("sh", component.sh, component.shRated, component.suctionPSIG);
    reportText += reportRefrigerant("sc", component.sc, component.scRated, component.liquidPSIG);
    reportText += reportField("ODDB", component.oddb, UNITS_DEGREES);
    reportText += reportField("IDWB", component.idwb, UNITS_DEGREES);
    reportText += reportField("Refrigerant Notes", component.refrigerantNotes);
    // CAPACITOR
    reportText += reportCapacitor("Fan", component.fanCap, component.fanCapRated, component.fanCapPM);
    reportText += reportCapacitor("Herm", component.hermCap, component.hermCapRated, component.hermCapPM);
    reportText += reportField("Capacitor Notes", component.capNotes);

    return reportText;
}

/**
 * Helper to generate text related to a Furnace component.
 */
function generateFurnaceReport(component) {
    var reportText = "";

    // ELECTRICAL
    reportText += reportFieldRated("FLA", component.fla, component.flaRated, UNITS_AMPS);
    reportText += reportFieldRated("Inducer", component.inducer, component.inducerRated, UNITS_AMPS);
    reportText += reportFieldRated("Flame Sensor ", component.flameSensor, component.flameSensorRated, UNITS_MICROAMPS);
    reportText += reportField("Electrical Notes", component.electricalNotes);
    // Airflow
    reportText += reportField("ΔT", component.tempSplit, UNITS_DEGREES);
    reportText += reportField("ESP", component.esp, UNITS_INCHES_WATERCOLUMN);
    reportText += reportField("Airflow Notes", component.airflowNotes);
    // CAPACITOR
    reportText += reportCapacitor("Blower", component.blowerCap, component.blowerCapRated, component.blowerCapPM);
    reportText += reportCapacitor("Inducer", component.inducerCap, component.inducerCapRated, component.inducerCapPM);
    reportText += reportField("Capacitor Notes", component.capNotes);

    return reportText;
}

/**
 * Helper to generate text related to a FAU component.
 */
function generateFAUReport(component) {
    var reportText = "";

    // ELECTRICAL
    reportText += reportFieldRated("FLA", component.fla, component.flaRated, UNITS_AMPS);
    reportText += reportField("Electrical Notes", component.electricalNotes);
    // Airflow
    reportText += reportField("ΔT", component.tempSplit, UNITS_DEGREES);
    reportText += reportField("ESP", component.esp, UNITS_INCHES_WATERCOLUMN);
    reportText += reportField("Airflow Notes", component.airflowNotes);
    // CAPACITOR
    reportText += reportCapacitor("Blower", component.blowerCap, component.blowerCapRated, component.blowerCapPM);
    reportText += reportField("Capacitor Notes", component.capNotes);

    return reportText;
}

/**
 * Creates the text for a report that is generated once all components have
 * been added and all of the data has been entered into the forms.
 */
function generateReport() {
    reportText = "";
    for (let component of components) {
        if (component.type == undefined || component.type == "New" || component.type == "") {
            continue;
        }
        reportText += component.type;
        reportText += component.sn ? " SN " + component.sn : "";
        reportText += "\n";

        reportText += reportField("Model", component.model);
        reportText += reportField("Notes", component.infoNotes);

        switch (component.type) {
            case "Condensor": 
                reportText += generateCondensorReport(component);
                break;
            case "Furnace":
                reportText += generateFurnaceReport(component);
                break;
            case "FAU":
                reportText += generateFAUReport(component);
                break;
            case "Coil":
                break;
        }

        reportText += "\n";
    }

    return reportText;
}

/**
 * Reads all of the inputs in form and sets component's object values to
 * what the form values are. The ids of the inputs in the form are what the
 * name of the property is in the component object.
 */
function setFields(component) {
    $('.model-val').each(function(i, obj) {
        var field = $(obj).attr('id');
        $(obj).val(component[field]);
    });
}

/**
 * Hides and disables fields and tabs that are not relevant to the current
 * component selected. Also shows the previously active tab for the component
 * that is currently selected, in case the component was just selected.
 */
function showForm(id) {
    var component = components[id];

    if (component == undefined) {
        $('#componentForm').addClass('invisible').hide();
        return;
    }
    if (!component.activeTab) {
        component.activeTab = "info-tab";
    }

    $('#dataTab').show();
    $('#componentForm').removeClass('invisible').show();
    $('#' + component.activeTab).tab('show');
    $('#airflow-tab').addClass('disabled');
    $('#refrigerant-tab').addClass('disabled');
    $('#electrical-tab').addClass('disabled');
    $('#capacitor-tab').addClass('disabled');
    $('#hermCapRow').addClass('invisible').hide();
    $('#fanCapRow').addClass('invisible').hide();
    $('#blowerCapRow').addClass('invisible').hide();
    $('#rlaRow').addClass('invisible').hide();
    $('#lraRow').addClass('invisible').hide();
    $('#flameSensorRow').addClass('invisible').hide();
    $('#inducerRow').addClass('invisible').hide();
    $('#inducerCapRow').addClass('invisible').hide();

    setFields(component);

    if (component.type == 'Condensor') {
        $('#refrigerant-tab').removeClass('disabled');
        $('#capacitor-tab').removeClass('disabled');
        $('#electrical-tab').removeClass('disabled');
        $('#rlaRow').removeClass('invisible').show();
        $('#lraRow').removeClass('invisible').show();
        $('#hermCapRow').removeClass('invisible').show();
        $('#fanCapRow').removeClass('invisible').show();
    } else if (component.type == 'FAU') {
        $('#airflow-tab').removeClass('disabled');
        $('#capacitor-tab').removeClass('disabled');
        $('#electrical-tab').removeClass('disabled');
        $('#blowerCapRow').removeClass('invisible').show();
    } else if (component.type == 'Furnace') {
        $('#airflow-tab').removeClass('disabled');
        $('#capacitor-tab').removeClass('disabled');
        $('#electrical-tab').removeClass('disabled');
        $('#blowerCapRow').removeClass('invisible').show();
        $('#flameSensorRow').removeClass('invisible').show();
        $('#inducerRow').removeClass('invisible').show();
        $('#inducerCapRow').removeClass('invisible').show();
    }
}

/**
 * Completely clears then remakes the ul that holds components from the
 * components array. Also calls for the form data to be redrawn so that
 * only appropriate fields for the component are being displayed. Sets up
 * the click event listener for components li.
 */
function drawComponents() {
    $('#componentsTab').empty();
    for (let id in components) {
        var component = components[id];
        var classVal = 'nav-link';
        if (id == activeIndex) {
            classVal += ' active'
        }

        var componentTitle = component.type ? component.type : "New";
        componentTitle += component.sn ? " SN " + component.sn : "";

        $('#componentsTab').append('<li class="nav-item"><button class="' + classVal + '">' + componentTitle + '</button></li>');

    }
    showForm(activeIndex);

    $('#componentsTab li').click(function(event) {
        activeIndex = $(this).index();
        showForm(activeIndex);
        updateComponents();
    });
}

/**
 * Stores activeIndex in localStorage
 */
function updateActiveIndex() {
    storage.setItem('activeIndex', activeIndex);
}

/**
 * Converts components array to JSON then stores it in localStorage.
 */
function updateComponents() {
    storage.setItem('components', JSON.stringify(components));
    updateActiveIndex();
    drawComponents();
}

/**
 * Attempts to clear localStorage
 */
function clearLocalStorage() {
    try {
        storage.clear();
    } catch (error) {
        console.error(error);
    }
}

/**
 * Clears components, activeIndex and localStorage. Resets page to as if
 * this is the first time the user has been on the page.
 */
function clearComponents() {
    clearLocalStorage();
    components = [];
    activeIndex = -1;
}

/**
 * Attempts to load components and activeIndex variables from localStorage.
 */
function loadLocalStorage() {
    try {
        components = storage.getItem('components');
        if (components == null) {
            components = "[]"; 
        }
        components = JSON.parse(components);
    } catch (error) {
        console.error(error);
        clearComponents();
    }
    try {
        activeIndex = storage.getItem('activeIndex');
        if (activeIndex == null) {
            activeIndex = components.length-1;
        }
    } catch (error) {
        console.error(error);
        activeIndex = components.length-1;
    }
}

/**
 * Initializes everything for page after document has loaded and is ready.
 */
function initializePage() {
    $('[data-toggle="tooltip"]').tooltip()
    loadLocalStorage();
    drawComponents();
}

/**
 * Waits for the page to fully loads, then initializes this app and sets up
 * click listeners for buttons.
 */
$(document).ready(function () {
    // Calls necessary initialization functions once page has loaded
    initializePage();

    // Set up click event listeners for buttons on page
    $('#copy-button').click(function() {
        let copyText = $('#reportNotes').text();
        var originalTitle = $('#copy-button').attr('data-bs-original-title');
        var success = navigator.clipboard.writeText(copyText);
        let updatedTitle = success ? "Copied!" : "Failed to copy.";
        $('#copy-button').attr('data-bs-original-title', updatedTitle).tooltip('show');
        $('#copy-button').attr('data-bs-original-title', originalTitle);
    });

    $('#report-button').click(function() {
        var myModal = new bootstrap.Modal($('#reportModal').get(0), {});
        $('#reportNotes').text(generateReport());
        myModal.show();
    });

    $('#clear-button').click(function() {
        if (confirm("Are you sure you want to delete ALL components and start fresh?")) {
            clearComponents();
            updateComponents();
        }
    });

    $('#add-button').click(function() {
        components.push(newComponent());
        activeIndex = components.length-1;
        updateComponents();
    });

    $('#delete-button').click(function() {
        if(confirm("Are you sure you want to delete the current component?")) {
            components.splice(activeIndex, 1);
            activeIndex -= 1;

            if(activeIndex < 0 || activeIndex > components.length-1) {
                activeIndex = components.length-1;
            }

            updateComponents();
        }
    });

    $('.data-tab').click(function() {
        components[activeIndex].activeTab = $(this).attr('id');
        updateComponents();
    });

    // Set up event listener to update components when form data changes
    $('.model-val').change(function() {
        components[activeIndex][$(this).attr('id')] = this.value;
        updateComponents();
    });

    // Scroll input into focus when clicked. (Fix for cell phones)
    $('input').focus( function() {
        var $input = $(this);
        var scroll = $input.offset();
        $input.closest('#viewport').animate({ scrollTop: $input.offset().top }, 'slow');
    });

    /*
    $(document).on('focus', 'input', function() {
        document.querySelector('input').scrollIntoView();
    });
    */

    $('body').on('focusin', 'input, textarea', function(event) {
        if(navigator.userAgent.indexOf('Android') > -1){
            var scroll = $(this).offset();
            window.scrollTo(0, scroll);
        }
    });
});
