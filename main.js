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
let UNITS_PSIG = " PSIG";
let UNITS_INCHES_WATERCOLUMN = "\" WC";
let UNITS_CFM = " CFM";


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
        'type': '',
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
 * Formats data for a field that has a target field for a report.
 */
function reportFieldTarget(label, field, target, units="", newline=true) {
    if (!field) {
        return "";
    }
    var reportText = reportField(label, field, units, false);
    if (target) {
        reportText += " (target " + target + units + ")";
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
    reportText += reportField("ODDB", component.oddb, UNITS_DEGREES);
    reportText += reportField("IDWB", component.idwb, UNITS_DEGREES);
    reportText += reportFieldTarget("Superheat", component.sh, component.shRated, UNITS_DEGREES);
    reportText += reportFieldTarget("Subcool", component.sc, component.scRated, UNITS_DEGREES);
    reportText += reportFieldTarget("Suction Line", component.suctionPSIG, component.targetSuctionPSIG, UNITS_PSIG);
    reportText += reportFieldTarget("Liquid Line", component.liquidPSIG, component.targetLiquidPSIG, UNITS_PSIG);
    reportText += reportFieldTarget("Approach", component.approach, component.targetApproach, UNITS_DEGREES);
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

    // GAS
    reportText += reportFieldTarget("Inlet Gas", component.inletGas, component.inletGasRated, UNITS_INCHES_WATERCOLUMN);
    reportText += reportFieldTarget("Outlet Gas (Hi)", component.outletHiGas, component.outletHiGasRated, UNITS_INCHES_WATERCOLUMN);
    reportText += reportFieldTarget("Outlet Gas (Low)", component.outletLowGas, component.outletLowGasRated, UNITS_INCHES_WATERCOLUMN);
    reportText += reportField("Gas Notes", component.gasNotes);
    // ELECTRICAL
    reportText += reportFieldRated("FLA", component.fla, component.flaRated, UNITS_AMPS);
    reportText += reportFieldRated("Inducer", component.inducer, component.inducerRated, UNITS_AMPS);
    reportText += reportFieldRated("Flame Sensor ", component.flameSensor, component.flameSensorRated, UNITS_MICROAMPS);
    reportText += reportField("Electrical Notes", component.electricalNotes);
    // Airflow
    reportText += reportField("Delta T", component.tempSplit, UNITS_DEGREES);
    reportText += reportField("ESP", component.esp, UNITS_INCHES_WATERCOLUMN);
    reportText += reportField("Volume", component.cfm, UNITS_CFM);
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
    reportText += reportFieldRated("Heat Strips", component.heatStripAmps, component.heatStripAmpsRated, UNITS_AMPS);
    reportText += reportField("Electrical Notes", component.electricalNotes);
    // Airflow
    reportText += reportField("Delta T", component.tempSplit, UNITS_DEGREES);
    reportText += reportField("ESP", component.esp, UNITS_INCHES_WATERCOLUMN);
    reportText += reportField("Volume", component.cfm, UNITS_CFM);
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
        reportText += component.sn ? " S/N " + component.sn : "";
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
    $('#gas-tab').addClass('disabled');
    $('#hermCapRow').addClass('invisible').hide();
    $('#fanCapRow').addClass('invisible').hide();
    $('#blowerCapRow').addClass('invisible').hide();
    $('#heatStripRow').addClass('invisible').hide();
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
        $('#heatStripRow').removeClass('invisible').show();
    } else if (component.type == 'Furnace') {
        $('#airflow-tab').removeClass('disabled');
        $('#capacitor-tab').removeClass('disabled');
        $('#electrical-tab').removeClass('disabled');
        $('#gas-tab').removeClass('disabled');
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
        var classVal = 'nav-link btn-sm';
        if (id == activeIndex) {
            classVal += ' active'
        }

        var componentType = component.type ? component.type.trim() : "New";
        if (components.length > 3) {
            if (componentType.length > 4) {
                componentType = componentType.substr(0, 4) + ".";
            }
        }
        switch (component.type) {
            case "Condensor":
                componentType = '<i class="fas fa-dice-d6"></i> ' + componentType;
                break;
            case "FAU":
                componentType = '<i class="fas fa-fan"></i> ' + componentType;
                break;
            case "Furnace":
                componentType = '<i class="fas fa-fire"></i> ' + componentType;
                break;
            case "Coil":
                componentType = '<i class="fas fa-temperature-low"></i> ' + componentType;
                break;
            default:
                componentType = '<i class="fas fa-star-of-life"></i> ' + componentType;
        }

        var componentTitle = componentType;
        componentTitle += component.sn ? '<footer class="sn-text">' + component.sn.trim().substr(-4) + '</footer>' : '<footer class="sn-text">&nbsp;</footer>';

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

    // Copy button click event
    $('#copy-button').click(function() {
        let copyText = $('#reportNotes').text();
        var originalTitle = $('#copy-button').attr('data-bs-original-title');
        var success = navigator.clipboard.writeText(copyText);
        let updatedTitle = success ? "Copied!" : "Failed to copy.";
        $('#copy-button').attr('data-bs-original-title', updatedTitle).tooltip('show');
        $('#copy-button').attr('data-bs-original-title', originalTitle);
    });

    // Report button click event
    $('#report-button').click(function() {
        var myModal = new bootstrap.Modal($('#reportModal').get(0), {});
        $('#reportNotes').text(generateReport());
        myModal.show();
    });

    // Clear button click event
    $('#clear-button').click(function() {
        if (confirm("Are you sure you want to delete ALL components and start fresh?")) {
            clearComponents();
            updateComponents();
        }
    });

    // Add button click event
    $('#add-button').click(function() {
        components.push(newComponent());
        activeIndex = components.length-1;
        updateComponents();
    });

    // Delete button click event
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

    // data-tab click event ("Info", "Electrical", "Refrigerant", etc..)
    $('.data-tab').click(function() {
        components[activeIndex].activeTab = $(this).attr('id');
        updateComponents();
    });

    // Set up event listener to update components when form data changes
    $('.model-val').change(function() {
        components[activeIndex][$(this).attr('id')] = this.value;
        updateComponents();
    });

    // Scroll input into focus when clicked or when keyboard pops up. (Fix for firefox on android)
    if(navigator.userAgent.indexOf('Android') > -1) {
        // Center selected input or textarea if screen is resized
        // Note: This can be slightly annoying if you have a input selected and scroll up causing
        // the navigation bar to hide, which is technically a resize, which will scroll back to the
        // input. User has to deselect the input box to scroll up if the navigation bar is present
        // or scroll up when the naviation bar isn't present.
        window.addEventListener("resize", function() {
            let tagName = document.activeElement.tagName
            if(tagName == "INPUT" || tagName == "TEXTAREA") {
                document.activeElement.scrollIntoView({block: "center"});
            }
        });
        // Center selected input when it is clicked. Probably not needed, but it replicates what
        // safari on iPhone does.
        $('body').on('focus', 'input, textarea', function() {
            //$(this).closest('.field-row')[0].scrollIntoView({block: "start"});
            $(this)[0].scrollIntoView({block: "center"});
        });
    }
});

// Add a whole bunch of whitespace at the bottom of the page for android.
if(navigator.userAgent.indexOf('Android') > -1) {
    for (var i=0; i<5; i++) {
        $('body').append('<div style="height: 15vh;"></div>');
    }
}
