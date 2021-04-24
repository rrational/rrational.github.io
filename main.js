var storage = window.localStorage;
var components = [];

var activeIndex = 0;

function newComponent() {
    return {
        'type': 'New',
        'activeTab': 'info-tab'
    };
}

function reportField(label, field, units="", newline=true) {
    if (!field) {
        return "";
    }
    if (!units) {
        units = "";
    }
    let reportText = " • " + label + ": " + field + units;
    if (newline) {
        return reportText + "\n";
    }
    return reportText;
}

function reportFieldRated(label, field, rated, units="", newline=true) {
    if (!field) {
        return "";
    }
    if (!units) {
        units = "";
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

function reportCapacitor(label, field, rated, plusMinus, newline=true) {
    if (!field) {
        return "";
    }
    var reportText = reportFieldRated(label + " Cap", field, rated, "µF", false);
    if (rated && plusMinus) {
        reportText += " ±" + plusMinus + "%";
    }
    if (newline) {
        reportText += "\n";
    }
    return reportText;
}

function reportRefrigerant(label, field, target, pressure, newline=true) {
    if (!field) {
        return "";
    }
    var reportText = " • " + label + ": " + field + "°F";
    if (pressure) {
        reportText += " @ " + pressure + " PSIG";
    }
    if (target) {
        reportText += " (target " + label + " " + target + "°F)";
    }
    if (newline) {
        reportText += "\n";
    }
    return reportText;
}

function generateCondensorReport(component) {
    var reportText = "";

    // ELECTRICAL
    reportText += reportFieldRated("FLA", component.fla, component.flaRated, "a");
    reportText += reportFieldRated("RLA", component.rla, component.rlaRated, "a");
    reportText += reportFieldRated("LRA", component.lra, component.lraRated, "a");
    reportText += reportField("Electrical Notes", component.electricalNotes);
    // REFRIGERANT
    reportText += reportField("Metering Device", component.meteringDevice);
    reportText += reportRefrigerant("sh", component.sh, component.shRated, component.suctionPSIG);
    reportText += reportRefrigerant("sc", component.sc, component.scRated, component.liquidPSIG);
    reportText += reportField("ODDB", component.oddb, "°F");
    reportText += reportField("IDWB", component.idwb, "°F");
    reportText += reportField("Refrigerant Notes", component.refrigerantNotes);

    // CAPACITOR
    reportText += reportCapacitor("Fan", component.fanCap, component.fanCapRated, component.fanCapPM);
    reportText += reportCapacitor("Herm", component.hermCap, component.hermCapRated, component.hermCapPM);
    reportText += reportField("Capacitor Notes", component.capNotes);

    return reportText;
}

function generateFurnaceReport(component) {
    var reportText = "";

    // ELECTRICAL
    reportText += reportFieldRated("FLA", component.fla, component.flaRated, "a");
    reportText += reportFieldRated("Inducer", component.inducer, component.inducerRated, "a");
    reportText += reportFieldRated("Flame Sensor ", component.flameSensor, component.flameSensorRated, "µa");
    reportText += reportField("Electrical Notes", component.electricalNotes);
    // Airflow
    reportText += reportField("ΔT", component.tempSplit, "°F");
    reportText += reportField("ESP", component.esp, "\" WC");
    reportText += reportField("Airflow Notes", component.airflowNotes);

    // CAPACITOR
    reportText += reportCapacitor("Blower", component.blowerCap, component.blowerCapRated, component.blowerCapPM);
    reportText += reportCapacitor("Inducer", component.inducerCap, component.inducerCapRated, component.inducerCapPM);
    reportText += reportField("Capacitor Notes", component.capNotes);

    return reportText;
}

function generateFAUReport(component) {
    var reportText = "";

    // ELECTRICAL
    reportText += reportFieldRated("FLA", component.fla, component.flaRated, "a");
    reportText += reportField("Electrical Notes", component.electricalNotes);
    // Airflow
    reportText += reportField("ΔT", component.tempSplit, "°F");
    reportText += reportField("ESP", component.esp, "\" WC");
    reportText += reportField("Airflow Notes", component.airflowNotes);

    // CAPACITOR
    reportText += reportCapacitor("Blower", component.blowerCap, component.blowerCapRated, component.blowerCapPM);
    reportText += reportField("Capacitor Notes", component.capNotes);

    return reportText;
}

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
                break;
            case "Coil":
                break;
        }

        reportText += "\n";
    }

    return reportText;
}

function setFields(component) {
    $('.model-val').each(function(i, obj) {
        var field = $(obj).attr('id');
        $(obj).val(component[field]);
    });
}

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

function drawComponents() {
    $('#componentsTab').empty();
    for (var id in components) {
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

function updateActiveIndex() {
    storage.setItem('activeIndex', activeIndex);
}

function updateComponents() {
    storage.setItem('components', JSON.stringify(components));
    updateActiveIndex();
    drawComponents();
}

function clearLocalStorage() {
    try {
        storage.clear();
    } catch (error) {
        console.error(error);
    }
}

function clearComponents() {
    clearLocalStorage();
    components = [];
    activeIndex = -1;
}

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
        console.log(activeIndex);
    } catch (error) {
        console.error(error);
        activeIndex = components.length-1;
    }
}

$(document).ready(function () {

    loadLocalStorage();
    drawComponents();

    $('#copy-button').click(function() {
        let copyText = $('#reportNotes').text();
        console.log(copyText);

        var originalTitle = $('#copy-button').attr('data-bs-original-title');
        /* Copy the text inside the text field */
        var success = navigator.clipboard.writeText(copyText);

        $('#copy-button').attr('data-bs-original-title', success ? "Copied!" : "Failed to copy.").tooltip('show');

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
        }
        updateComponents();
    });

    $('#add-button').click(function() {
        components.push(newComponent());
        activeIndex = components.length-1;
        updateComponents();
    });

    $('#delete-button').click(function() {
        if(confirm("Are you sure you want to delete the current component?")) {
            components.splice(activeIndex, 1);
        }
        activeIndex -= 1;

        if(activeIndex < 0 || activeIndex > components.length-1) {
            activeIndex = components.length-1;
        }

        updateComponents();
    });

    $('.model-val').change(function() {
        components[activeIndex][$(this).attr('id')] = this.value;
        updateComponents();
    });

    $('.data-tab').click(function() {
        components[activeIndex].activeTab = $(this).attr('id');
        updateComponents();
    });

});
$(function () {
  $('[data-toggle="tooltip"]').tooltip()
});