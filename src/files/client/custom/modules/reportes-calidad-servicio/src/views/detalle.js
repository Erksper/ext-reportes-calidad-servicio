define("reportes-calidad-servicio:views/detalle", [
    "view",
], function (Dep) {
    return Dep.extend({
        template: "reportes-calidad-servicio:detalle",

        setup: function () {
            this.surveyId = this.options.surveyId;
            this.encuesta = null;
        },

        afterRender: function () {
            this.cargarDetalle();
        },

        cargarDetalle: function () {
            Espo.Ajax.getRequest("CCustomerSurvey/action/getDetalleEncuesta", {
                surveyId: this.surveyId
            })
                .then(function (response) {
                    if (response.success) {
                        this.encuesta = response.data;
                        this.renderizarDetalle();
                    }
                }.bind(this))
                .catch(function (error) {
                    var container = this.$el.find('#detalle-container');
                    container.html('<div class="alert alert-danger">Error al cargar detalle de la encuesta</div>');
                }.bind(this));
        },

        renderizarDetalle: function () {
            var container = this.$el.find('#detalle-container');
            var encuesta = this.encuesta;
            
            // Actualizar número de encuesta en header
            this.$el.find('#numero-encuesta').text(encuesta.id.substring(0, 8));
            
            var html = '';
            
            // Card de información básica
            html += '<div class="row"><div class="col-md-12">';
            html += '<div class="info-card">';
            html += '<div class="info-card-header">';
            html += '<i class="fas fa-info-circle info-card-icon"></i>';
            html += '<h3 class="info-card-title">Información Básica</h3>';
            html += '</div>';
            html += '<div class="info-grid">';
            html += '<div class="info-item"><span class="info-label">Cliente</span><span class="info-value">' + (encuesta.clientName || '-') + '</span></div>';
            html += '<div class="info-item"><span class="info-label">Email</span><span class="info-value">' + (encuesta.emailAddress || '-') + '</span></div>';
            html += '<div class="info-item"><span class="info-label">Asesor</span><span class="info-value">' + (encuesta.asesorNombre || '-') + '</span></div>';
            html += '<div class="info-item"><span class="info-label">Oficina</span><span class="info-value">' + (encuesta.oficinaNombre || '-') + '</span></div>';
            html += '<div class="info-item"><span class="info-label">Tipo de Operación</span><span class="info-value">' + (encuesta.operationType || '-') + '</span></div>';
            html += '<div class="info-item"><span class="info-label">Fecha</span><span class="info-value">' + (encuesta.createdAt ? new Date(encuesta.createdAt).toLocaleDateString('es-ES') : '-') + '</span></div>';
            
            // ✅ AGREGAR: Estatus
            var estatusMap = {
                '0': { texto: 'Pendiente', color: '#3498db' },
                '1': { texto: 'En Proceso', color: '#f39c12' },
                '2': { texto: 'Completada', color: '#27ae60' },
                '3': { texto: 'Cancelada', color: '#e74c3c' }
            };
            var estatusInfo = estatusMap[encuesta.estatus] || { texto: 'Desconocido', color: '#95a5a6' };
            html += '<div class="info-item"><span class="info-label">Estatus</span><span class="info-value"><span style="background: ' + estatusInfo.color + '; color: white; padding: 4px 12px; border-radius: 4px; font-size: 14px;">' + estatusInfo.texto + '</span></span></div>';
            
            // ✅ AGREGAR: Reenvíos
            html += '<div class="info-item"><span class="info-label">Reenvíos</span><span class="info-value" style="color: #B8A279; font-weight: 700;">' + (encuesta.reenvios || 0) + '</span></div>';
            
            // ✅ AGREGAR: Último reenvío
            var ultimoReenvio = encuesta.ultimoReenvio ? new Date(encuesta.ultimoReenvio).toLocaleDateString('es-ES') + ' ' + new Date(encuesta.ultimoReenvio).toLocaleTimeString('es-ES') : 'N/A';
            html += '<div class="info-item"><span class="info-label">Último Reenvío</span><span class="info-value">' + ultimoReenvio + '</span></div>';
            
            html += '</div>';
            html += '</div>';
            html += '</div></div>';
            
            // Card de calificaciones
            html += '<div class="row"><div class="col-md-12">';
            html += '<div class="info-card">';
            html += '<div class="info-card-header">';
            html += '<i class="fas fa-star info-card-icon"></i>';
            html += '<h3 class="info-card-title">Calificaciones del Servicio</h3>';
            html += '</div>';
            html += '<div class="calificaciones-grid">';
            
            var campos = [
                { key: 'communicationEffectiveness', label: 'Efectividad en Comunicación' },
                { key: 'legalAdvice', label: 'Asesoría Legal' },
                { key: 'businessKnowledge', label: 'Conocimiento del Negocio' },
                { key: 'personalPresentation', label: 'Presentación Personal' },
                { key: 'detailManagement', label: 'Manejo de Detalles' },
                { key: 'punctuality', label: 'Puntualidad' },
                { key: 'commitmentLevel', label: 'Nivel de Compromiso' },
                { key: 'problemSolving', label: 'Solución de Problemas' },
                { key: 'fullSupport', label: 'Acompañamiento Completo' },
                { key: 'unexpectedSituations', label: 'Manejo de Imprevistos' },
                { key: 'negotiationTiming', label: 'Tiempos de Negociación' },
                { key: 'officeRating', label: 'Calificación de Oficina' }
            ];
            
            campos.forEach(function (campo) {
                var valor = encuesta[campo.key] || '-';
                var estrellas = '';
                if (valor !== '-') {
                    for (var i = 0; i < parseInt(valor); i++) {
                        estrellas += '★';
                    }
                    for (var j = parseInt(valor); j < 5; j++) {
                        estrellas += '☆';
                    }
                }
                
                html += '<div class="calificacion-item">';
                html += '<span class="calificacion-label">' + campo.label + '</span>';
                html += '<div class="calificacion-valor">';
                html += '<span class="estrellas">' + estrellas + '</span>';
                html += '<span style="font-weight: 600; color: #B8A279;">' + valor + '/5</span>';
                html += '</div>';
                html += '</div>';
            });
            
            html += '</div>';
            html += '</div>';
            html += '</div></div>';
            
            // Card de calificación general
            html += '<div class="row"><div class="col-md-12">';
            html += '<div class="info-card">';
            html += '<div class="info-card-header">';
            html += '<i class="fas fa-chart-line info-card-icon"></i>';
            html += '<h3 class="info-card-title">Evaluación General</h3>';
            html += '</div>';
            html += '<div class="info-grid">';
            
            var calificacionGeneral = encuesta.generalAdvisorRating || '-';
            var estrellasGeneral = '';
            if (calificacionGeneral !== '-') {
                for (var i = 0; i < parseInt(calificacionGeneral); i++) {
                    estrellasGeneral += '★';
                }
                for (var j = parseInt(calificacionGeneral); j < 5; j++) {
                    estrellasGeneral += '☆';
                }
            }
            
            html += '<div class="info-item">';
            html += '<span class="info-label">Calificación General del Asesor</span>';
            html += '<span class="info-value"><span class="estrellas">' + estrellasGeneral + '</span> ' + calificacionGeneral + '/5</span>';
            html += '</div>';
            
            var recomendacion = encuesta.recommendation === '1' ? 'Sí recomendaría' : 'No recomendaría';
            var recomendacionColor = encuesta.recommendation === '1' ? '#27ae60' : '#e74c3c';
            
            html += '<div class="info-item">';
            html += '<span class="info-label">¿Recomendaría el servicio?</span>';
            html += '<span class="info-value" style="color: ' + recomendacionColor + '; font-weight: 700;">' + recomendacion + '</span>';
            html += '</div>';
            
            html += '</div>';
            html += '</div>';
            html += '</div></div>';
            
            // Card de medios de contacto
            if (encuesta.contactMedium && encuesta.contactMedium.length > 0) {
                html += '<div class="row"><div class="col-md-12">';
                html += '<div class="info-card">';
                html += '<div class="info-card-header">';
                html += '<i class="fas fa-phone info-card-icon"></i>';
                html += '<h3 class="info-card-title">Medios de Contacto</h3>';
                html += '</div>';
                
                var mediosMap = {
                    '0': 'Familiar/Amigo',
                    '1': 'Mercado Libre',
                    '2': 'Página Web',
                    '3': 'Facebook',
                    '4': 'Estados WhatsApp',
                    '5': 'Valla/Rótulo',
                    '6': 'Instagram',
                    '7': 'Visita en oficina',
                    '8': 'Contacto Directo',
                    '9': 'Otro'
                };
                
                var medios = encuesta.contactMedium.map(function (m) {
                    return mediosMap[m] || m;
                }).join(', ');
                
                html += '<p style="color: #363438; font-size: 16px; margin: 0;">' + medios + '</p>';
                html += '</div>';
                html += '</div></div>';
            }
            
            // Card de comentarios
            if (encuesta.additionalFeedback && encuesta.additionalFeedback.trim() !== '') {
                html += '<div class="row"><div class="col-md-12">';
                html += '<div class="info-card">';
                html += '<div class="info-card-header">';
                html += '<i class="fas fa-comment info-card-icon"></i>';
                html += '<h3 class="info-card-title">Comentarios y Sugerencias</h3>';
                html += '</div>';
                html += '<div class="comentario-box">';
                html += '<p style="margin: 0; font-size: 15px;">"' + encuesta.additionalFeedback + '"</p>';
                html += '</div>';
                html += '</div>';
                html += '</div></div>';
            }
            
            container.html(html);
        }
    });
});