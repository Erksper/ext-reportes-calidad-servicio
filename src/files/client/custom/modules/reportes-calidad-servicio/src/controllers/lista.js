define("reportes-calidad-servicio:controllers/lista", [
    "controllers/base",
], function (Base) {
    return Base.extend({
        checkAccess: function () {
            return true;
        },

        defaultAction: "index",

        actionIndex: function (options) {
            const viewParams = {
                scope: "CCustomerSurvey",
                previousRoute: null,
            };

            this.main("reportes-calidad-servicio:views/lista", viewParams);
        },

        actionDetalle: function (options) {
            let surveyId;

            if (typeof options === "string") {
                surveyId = options;
            } else if (options && options.surveyId) {
                surveyId = options.surveyId;
            } else if (options && options.id) {
                surveyId = options.id;
            }

            if (!surveyId) {
                Espo.Ui.error("No se especificó una encuesta válida");
                this.getRouter().navigate("#Lista", { trigger: true });
                return;
            }

            const viewParams = {
                surveyId: surveyId,
                scope: "CCustomerSurvey",
                previousRoute: "#Lista",
            };

            this.main("reportes-calidad-servicio:views/detalle", viewParams);
        },
    });
});