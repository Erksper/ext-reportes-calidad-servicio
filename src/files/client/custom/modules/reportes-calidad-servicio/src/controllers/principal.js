define("reportes-calidad-servicio:controllers/principal", ["controllers/base"], function (Base) {
    return Base.extend({
        checkAccess: function () {
            return true;
        },

        defaultAction: "index",

        actionIndex: function () {
            console.log("🔍 DEBUG: Controlador principal cargado");
            console.log("🔍 DEBUG: this:", this);
            console.log("🔍 DEBUG: Nombre del controlador:", this.name);
            
            const viewParams = {
                scope: "CCustomerSurvey",
                initialStats: this.getDefaultStats(),
                params: this.options.params || {},
                model: this.options.model || null,
                collection: this.options.collection || null,
            };

            this.main("reportes-calidad-servicio:views/principal");
        },

        getDefaultStats: function () {
            return {
                totalEncuestas: 0,
                satisfaccionPromedio: 0,
                porcentajeRecomendacion: 0,
                tiposOperacion: 0,
                distribucionOperaciones: {
                    Venta: 0,
                    Compra: 0,
                    Alquiler: 0,
                },
                asesoresDestacados: [],
            };
        },

        // ✅ NUEVA: Acción para comparación de asesores
        actionComparacionAsesores: function (params) {
            const urlParams = new URLSearchParams(
                window.location.hash.split("?")[1] || ""
            );

            this.main(
                "reportes-calidad-servicio:views/comparacion-asesores",
                {
                    oficinaId: urlParams.get("oficina") || params.oficina,
                    claId: urlParams.get("cla") || params.cla,
                    oficinaNombre: decodeURIComponent(
                        urlParams.get("nombre") || params.nombre || "Oficina"
                    ),
                },
                function (view) {
                    view.render();
                }
            );
        },

        actionPrueba: function() {
             this.main("reportes-calidad-servicio:views/prueba")
        },
    });
});
