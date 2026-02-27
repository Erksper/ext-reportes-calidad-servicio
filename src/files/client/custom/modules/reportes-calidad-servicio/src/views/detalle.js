define("reportes-calidad-servicio:views/detalle", [
    "view",
    "reportes-calidad-servicio:views/modules/permisos",
], function (Dep, PermisosManager) {
    return Dep.extend({
        template: "reportes-calidad-servicio:detalle",

        setup: function () {
            this.surveyId = this.options.surveyId;
            this.encuesta = null;
            this.permisosManager = new PermisosManager(this);
            this.editandoTelefono = false;
            this.nombreOficinaUsuario  = '';
            this.nombreCompletoUsuario = '';
        },

        afterRender: function () {
            this.setupEventListeners();
            this.cargarPermisos();
        },

        cargarPermisos: function () {
            this.permisosManager.cargarPermisosUsuario()
                .then(function (permisos) {
                    this.permisos = permisos;
                    var esRolFormal = (
                        permisos.esGerente     ||
                        permisos.esDirector    ||
                        permisos.esCasaNacional
                    );
                    if (esRolFormal) {
                        this.cargarDatosUsuarioLogueado(permisos.usuarioId)
                            .then(function () {
                                this.cargarDetalle();
                            }.bind(this));
                    } else {
                        this.cargarDetalle();
                    }
                }.bind(this))
                .catch(function (error) {
                    console.error("Error cargando permisos:", error);
                    this.cargarDetalle();
                }.bind(this));
        },

        cargarDatosUsuarioLogueado: function (userId) {
            var self = this;
            return Espo.Ajax.getRequest("CCustomerSurvey/action/getInfoAsesor", {
                asesorId: userId
            })
                .then(function (response) {
                    if (response.success && response.data && response.data.nombre) {
                        self.nombreCompletoUsuario = response.data.nombre;
                        self.nombreOficinaUsuario  = response.data.oficina || '';
                    } else {
                        return Espo.Ajax.getRequest("CCustomerSurvey/action/getUserInfo", {
                            userId: userId
                        }).then(function (r2) {
                            if (r2.success && r2.data) {
                                self.nombreCompletoUsuario = r2.data.userName || '';
                                self.nombreOficinaUsuario  = self.nombreOficinaUsuario || '';
                            }
                        });
                    }
                })
                .catch(function (err) {
                    console.warn("Error cargando datos del usuario logueado:", err);
                });
        },

        setupEventListeners: function () {
            this.$el.find('[data-action="volver"]').on('click', function () {
                // Volver con filtros si los hay en la URL
                var hash = window.location.hash;
                if (hash && hash.includes('?')) {
                    var queryString = hash.split('?')[1];
                    this.getRouter().navigate('#Lista?' + queryString, { trigger: true });
                } else {
                    this.getRouter().navigate('#Lista', { trigger: true });
                }
            }.bind(this));

            this.$el.find('[data-action="ejecutar-workflow"]').on('click', function () {
                this.ejecutarWorkflow();
            }.bind(this));
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
                .catch(function () {
                    this.$el.find('#detalle-container')
                        .html('<div class="alert alert-danger">Error al cargar detalle de la encuesta</div>');
                }.bind(this));
        },

        titleCase: function (str) {
            if (!str) return '';
            // Capitalizar solo la primera letra de cada palabra, manejando
            // correctamente tildes y ñ (que JS /\b/ trata como separadores).
            // Estrategia: split por espacios, capitalizar primer carácter de cada token.
            return str.toLowerCase().split(' ').map(function (palabra) {
                if (!palabra) return '';
                return palabra.charAt(0).toUpperCase() + palabra.slice(1);
            }).join(' ');
        },

        renderizarDetalle: function () {
            var container = this.$el.find('#detalle-container');
            var encuesta  = this.encuesta;

            this.$el.find('#numero-encuesta').text(encuesta.id.substring(0, 8));

            if (encuesta.url) {
                this.$el.find('.header-icon')
                    .css({ cursor: 'pointer' })
                    .attr('title', 'Ir a la encuesta')
                    .off('click')
                    .on('click', function () {
                        window.open(encuesta.url, '_blank');
                    });
            }

            var clientNameDisplay   = this.titleCase(encuesta.clientName   || '');
            var asesorNombreDisplay = this.titleCase(encuesta.asesorNombre || '');

            var html = '';

            var puedeEditarTelefono = this.permisos && (
                this.permisos.esGerente     ||
                this.permisos.esDirector    ||
                this.permisos.esCoordinador ||
                this.permisos.esCasaNacional
            );

            // ── Información Básica ─────────────────────────────────
            html += '<div class="row"><div class="col-md-12"><div class="info-card">';
            html += '<div class="info-card-header">';
            html += '<i class="fas fa-info-circle info-card-icon"></i>';
            html += '<h3 class="info-card-title">Información Básica</h3>';
            html += '</div><div class="info-grid">';

            html += '<div class="info-item"><span class="info-label">Cliente</span>'
                  + '<span class="info-value">' + (clientNameDisplay || '-') + '</span></div>';
            html += '<div class="info-item"><span class="info-label">Email</span>'
                  + '<span class="info-value">' + (encuesta.emailAddress || '-') + '</span></div>';

            html += '<div class="info-item"><span class="info-label">Teléfono</span>';
            if (puedeEditarTelefono) {
                html += '<div class="campo-editable">';
                html += '<input type="tel" id="input-telefono" value="' + (encuesta.phoneNumber || '') + '" disabled>';
                html += '<button class="btn-editar" id="btn-editar-telefono" title="Editar teléfono">'
                      + '<i class="fas fa-pencil-alt"></i></button>';
                html += '</div>';
            } else {
                html += '<span class="info-value">' + (encuesta.phoneNumber || '-') + '</span>';
            }
            html += '</div>';

            html += '<div class="info-item"><span class="info-label">Asesor</span>'
                  + '<span class="info-value">' + (asesorNombreDisplay || '-') + '</span></div>';
            html += '<div class="info-item"><span class="info-label">Oficina</span>'
                  + '<span class="info-value">' + (encuesta.oficinaNombre || '-') + '</span></div>';
            html += '<div class="info-item"><span class="info-label">Tipo de Operación</span>'
                  + '<span class="info-value">' + (encuesta.operationType || '-') + '</span></div>';
            html += '<div class="info-item"><span class="info-label">Fecha</span>'
                  + '<span class="info-value">' + (encuesta.createdAt ? new Date(encuesta.createdAt).toLocaleDateString('es-ES') : '-') + '</span></div>';

            var estatusMap = {
                '0': { texto: 'No enviado', color: '#3498db' },
                '1': { texto: 'Enviado',    color: '#f39c12' },
                '2': { texto: 'Completado', color: '#27ae60' }
            };
            var estatusInfo = estatusMap[encuesta.estatus] || { texto: 'Desconocido', color: '#95a5a6' };
            html += '<div class="info-item"><span class="info-label">Estado</span>'
                  + '<span class="info-value"><span style="background:' + estatusInfo.color
                  + ';color:white;padding:4px 12px;border-radius:4px;font-size:14px;">'
                  + estatusInfo.texto + '</span></span></div>';

            html += '<div class="info-item"><span class="info-label">Reenvíos Realizados</span>'
                  + '<span class="info-value" style="color:#B8A279;font-weight:700;">'
                  + (encuesta.reenvios || 0) + '</span></div>';

            var ultimoReenvio = encuesta.ultimoReenvio
                ? new Date(encuesta.ultimoReenvio).toLocaleDateString('es-ES')
                  + ' ' + new Date(encuesta.ultimoReenvio).toLocaleTimeString('es-ES')
                : 'N/A';
            html += '<div class="info-item"><span class="info-label">Último Reenvío</span>'
                  + '<span class="info-value">' + ultimoReenvio + '</span></div>';

            html += '</div></div></div></div>';

            // ── Sección WhatsApp ───────────────────────────────────
            // Se muestra SIEMPRE. El botón "Enviar por WhatsApp" solo para
            // casa nacional, gerentes y directores (si además hay teléfono).
            {
                var mensajeWhatsapp   = this.generarMensajeWhatsapp(encuesta, clientNameDisplay, asesorNombreDisplay);
                var rawPhone          = (encuesta.phoneNumber !== null && encuesta.phoneNumber !== undefined)
                                        ? String(encuesta.phoneNumber)
                                        : '';
                var telefonoLimpio    = rawPhone.replace(/\D/g, '');
                var hayTelefono       = telefonoLimpio.length > 0;
                var mensajeCodificado = encodeURIComponent(mensajeWhatsapp);

                var puedeVerBotonWA = this.permisos && (
                    this.permisos.esCasaNacional ||
                    this.permisos.esGerente      ||
                    this.permisos.esDirector
                );

                html += '<div class="row"><div class="col-md-12"><div class="info-card">';
                html += '<div class="info-card-header">';
                html += '<i class="fab fa-whatsapp info-card-icon" style="color:#25D366;font-size:22px;"></i>';
                html += '<h3 class="info-card-title">Mensaje con link</h3>';
                html += '</div>';

                html += '<div style="display:flex;justify-content:flex-end;align-items:center;gap:8px;margin-bottom:12px;">';
                html += '<button class="btn-copiar" id="btn-copiar-mensaje"><i class="fas fa-copy"></i> Copiar mensaje</button>';
                if (puedeVerBotonWA && hayTelefono) {
                    html += '<a class="btn-copiar btn-whatsapp-verde"'
                          + ' href="https://wa.me/' + telefonoLimpio + '?text=' + mensajeCodificado + '"'
                          + ' target="_blank">'
                          + '<i class="fab fa-whatsapp"></i> Enviar por WhatsApp</a>';
                }
                html += '</div>';

                html += '<textarea id="mensaje-whatsapp" readonly style="'
                      + 'width:100%;min-height:210px;padding:15px;'
                      + 'border:1px solid #E6E6E6;border-radius:8px;border-left:4px solid #25D366;'
                      + 'background:#f9f9f9;font-size:14px;line-height:1.75;'
                      + 'color:#363438;resize:vertical;font-family:inherit;cursor:text;">';
                html += this.escapeHtml(mensajeWhatsapp);
                html += '</textarea>';
                html += '</div></div></div>';
            } // fin bloque WhatsApp

            // ── Calificaciones ─────────────────────────────────────
            html += '<div class="row"><div class="col-md-12"><div class="info-card">';
            html += '<div class="info-card-header">';
            html += '<i class="fas fa-star info-card-icon"></i>';
            html += '<h3 class="info-card-title">Calificaciones del Servicio</h3>';
            html += '</div><div class="calificaciones-grid">';

            var campos = [
                { key: 'communicationEffectiveness', label: 'Efectividad en Comunicación' },
                { key: 'legalAdvice',                label: 'Asesoría Legal' },
                { key: 'businessKnowledge',          label: 'Conocimiento del Negocio' },
                { key: 'personalPresentation',       label: 'Presentación Personal' },
                { key: 'detailManagement',           label: 'Manejo de Detalles' },
                { key: 'punctuality',                label: 'Puntualidad' },
                { key: 'commitmentLevel',            label: 'Nivel de Compromiso' },
                { key: 'problemSolving',             label: 'Solución de Problemas' },
                { key: 'fullSupport',                label: 'Acompañamiento Completo' },
                { key: 'unexpectedSituations',       label: 'Manejo de Imprevistos' },
                { key: 'negotiationTiming',          label: 'Tiempos de Negociación' },
                { key: 'officeRating',               label: 'Calificación de Oficina' }
            ];

            campos.forEach(function (campo) {
                var valor    = encuesta[campo.key] || '-';
                var estrellas = '';
                if (valor !== '-') {
                    for (var i = 0; i < parseInt(valor); i++) { estrellas += '★'; }
                    for (var j = parseInt(valor); j < 5; j++) { estrellas += '☆'; }
                }
                html += '<div class="calificacion-item">';
                html += '<span class="calificacion-label">' + campo.label + '</span>';
                html += '<div class="calificacion-valor">';
                html += '<span class="estrellas">' + estrellas + '</span>';
                html += '<span style="font-weight:600;color:#B8A279;">' + valor + '/5</span>';
                html += '</div></div>';
            });
            html += '</div></div></div></div>';

            // ── Evaluación General ─────────────────────────────────
            html += '<div class="row"><div class="col-md-12"><div class="info-card">';
            html += '<div class="info-card-header">';
            html += '<i class="fas fa-chart-line info-card-icon"></i>';
            html += '<h3 class="info-card-title">Evaluación General</h3>';
            html += '</div><div class="info-grid">';

            var calGen = encuesta.generalAdvisorRating || '-';
            var estrellasGen = '';
            if (calGen !== '-') {
                for (var i2 = 0; i2 < parseInt(calGen); i2++) { estrellasGen += '★'; }
                for (var j2 = parseInt(calGen); j2 < 5; j2++) { estrellasGen += '☆'; }
            }
            html += '<div class="info-item"><span class="info-label">Calificación General del Asesor</span>'
                  + '<span class="info-value"><span class="estrellas">' + estrellasGen + '</span> '
                  + calGen + '/5</span></div>';

            var recTexto = encuesta.recommendation === '1' ? 'Sí recomendaría' : 'No recomendaría';
            var recColor = encuesta.recommendation === '1' ? '#27ae60' : '#e74c3c';
            html += '<div class="info-item"><span class="info-label">¿Recomendaría el servicio?</span>'
                  + '<span class="info-value" style="color:' + recColor + ';font-weight:700;">'
                  + recTexto + '</span></div>';
            html += '</div></div></div></div>';

            // ── Medios de Contacto ─────────────────────────────────
            if (encuesta.contactMedium && encuesta.contactMedium.length > 0) {
                var mediosMap = {
                    '0': 'Familiar/Amigo', '1': 'Mercado Libre',     '2': 'Página Web',
                    '3': 'Facebook',       '4': 'Estados WhatsApp',  '5': 'Valla/Rótulo',
                    '6': 'Instagram',      '7': 'Visita en oficina', '8': 'Contacto Directo', '9': 'Otro'
                };
                var medios = encuesta.contactMedium
                    .map(function (m) { return mediosMap[m] || m; })
                    .join(', ');
                html += '<div class="row"><div class="col-md-12"><div class="info-card">';
                html += '<div class="info-card-header">';
                html += '<i class="fas fa-phone info-card-icon"></i>';
                html += '<h3 class="info-card-title">Medios de Contacto</h3>';
                html += '</div>';
                html += '<p style="color:#363438;font-size:16px;margin:0;">' + medios + '</p>';
                html += '</div></div></div>';
            }

            // ── Comentarios ────────────────────────────────────────
            if (encuesta.additionalFeedback && encuesta.additionalFeedback.trim() !== '') {
                html += '<div class="row"><div class="col-md-12"><div class="info-card">';
                html += '<div class="info-card-header">';
                html += '<i class="fas fa-comment info-card-icon"></i>';
                html += '<h3 class="info-card-title">Comentarios y Sugerencias</h3>';
                html += '</div>';
                html += '<div class="comentario-box">';
                html += '<p style="margin:0;font-size:15px;">"' + encuesta.additionalFeedback + '"</p>';
                html += '</div></div></div></div>';
            }

            container.html(html);

            if (this.permisos && this.permisos.esCasaNacional) {
                this.$el.find('.btn-workflow').css('display', 'flex');
            }
            if (puedeEditarTelefono) {
                this.setupTelefonoEditable();
            }
            this.setupBotonesCopiar();
        },

        generarMensajeWhatsapp: function (encuesta, clientNameDisplay, asesorNombreDisplay) {
            var permisos     = this.permisos || {};
            var clientName   = clientNameDisplay   || this.titleCase(encuesta.clientName)   || 'Cliente';
            var asesorNombre = asesorNombreDisplay || this.titleCase(encuesta.asesorNombre) || 'el asesor';
            var urlEncuesta  = encuesta.url || '[URL de la encuesta]';

            var esRolFormal = (
                permisos.esGerente     ||
                permisos.esDirector    ||
                permisos.esCasaNacional
            );

            if (esRolFormal) {
                var rolTexto;
                if (permisos.esCasaNacional) {
                    rolTexto = 'Revisor';
                } else if (permisos.esGerente) {
                    rolTexto = 'Gerente';
                } else {
                    rolTexto = 'Director';
                }

                var nombreFirmante = this.titleCase(this.nombreCompletoUsuario) || 'el responsable';
                var oficina = (this.nombreOficinaUsuario || '').trim();

                var oficinaTexto;
                if (permisos.esCasaNacional) {
                    // Solo el rol Casa Nacional muestra "de casa nacional"
                    oficinaTexto = (!oficina || oficina.toLowerCase() === 'venezuela')
                        ? 'de casa nacional'
                        : 'de la Oficina ' + oficina;
                } else {
                    // Gerente / Director: siempre muestra su oficina
                    // Si por algún motivo no cargó, usa la oficina del registro
                    var oficinaFinal = oficina || encuesta.oficinaNombre || '';
                    oficinaTexto = oficinaFinal
                        ? 'de la Oficina ' + oficinaFinal
                        : 'de la oficina asignada';
                }

                return (
                    'Estimado Sr. / Sra. ' + clientName + ', es un gusto saludarle.\n\n' +
                    'Mi nombre es: ' + nombreFirmante + ', ' + rolTexto + ' ' + oficinaTexto + '. ' +
                    'Quiero agradecerte la confianza depositada en C21 en nuestra reciente negociación ' +
                    'con nuestro(a) asesor(a) ' + asesorNombre + '.\n\n' +
                    'Para nosotros es fundamental saber cómo fue su experiencia. ' +
                    '¿Podrías regalarnos 3 minutos para completar esta breve encuesta?\n\n' +
                    urlEncuesta + '\n\n' +
                    'Sus comentarios son clave para que sigamos mejorando y brindándote el servicio que mereces.\n\n' +
                    '¡Muchas gracias por tu apoyo!\n\n' +
                    'Saludos,\n' + nombreFirmante
                );
            } else {
                var firmante = this.titleCase(encuesta.asesorNombre) || 'el asesor';
                return (
                    'Hola Sr. / Sra. ' + clientName + ', es un gusto saludarle.\n\n' +
                    'Quiero agradecerte nuevamente por la confianza depositada en C21 en nuestra reciente negociación.\n\n' +
                    'Para nosotros es fundamental saber cómo fue tu experiencia. ' +
                    '¿Podrías regalarnos 3 minutos para completar esta breve encuesta?\n\n' +
                    urlEncuesta + '\n\n' +
                    'Tus comentarios son clave para que sigamos mejorando y brindándote el servicio que mereces.\n\n' +
                    '¡Muchas gracias por tu apoyo!\n\n' +
                    'Saludos,\n' + firmante
                );
            }
        },

        setupBotonesCopiar: function () {
            var self = this;
            var $btn = this.$el.find('#btn-copiar-mensaje');
            if ($btn.length) {
                $btn.off('click').on('click', function () {
                    var mensaje = self.$el.find('#mensaje-whatsapp').val();
                    if (!mensaje || mensaje.trim() === '') {
                        Espo.Ui.error('No hay mensaje para copiar');
                        return;
                    }
                    self.copiarAlPortapapeles(mensaje, 'Mensaje copiado al portapapeles');
                });
            }
        },

        copiarAlPortapapeles: function (texto, mensajeExito) {
            var self = this;
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(texto)
                    .then(function () { Espo.Ui.success(mensajeExito); })
                    .catch(function () { self.copiarFallback(texto, mensajeExito); });
            } else {
                this.copiarFallback(texto, mensajeExito);
            }
        },

        copiarFallback: function (texto, mensajeExito) {
            var ta = document.createElement('textarea');
            ta.value = texto;
            ta.style.cssText = 'position:fixed;top:0;left:-9999px;opacity:0;';
            document.body.appendChild(ta);
            ta.focus();
            ta.select();
            try {
                if (document.execCommand('copy')) {
                    Espo.Ui.success(mensajeExito);
                } else {
                    Espo.Ui.error('No se pudo copiar. Selecciona el texto manualmente.');
                }
            } catch (e) {
                Espo.Ui.error('Error al copiar: ' + e.message);
            }
            document.body.removeChild(ta);
        },

        escapeHtml: function (texto) {
            return texto
                .replace(/&/g,  '&amp;')
                .replace(/</g,  '&lt;')
                .replace(/>/g,  '&gt;')
                .replace(/"/g,  '&quot;');
        },

        setupTelefonoEditable: function () {
            var self = this;
            var btnEditar     = this.$el.find('#btn-editar-telefono');
            var inputTelefono = this.$el.find('#input-telefono');

            btnEditar.off('click').on('click', function () {
                if (!self.editandoTelefono) {
                    self.editandoTelefono = true;
                    inputTelefono.prop('disabled', false).focus();
                    btnEditar.html('<i class="fas fa-save"></i>').attr('title', 'Guardar teléfono');
                    btnEditar.addClass('btn-guardar').removeClass('btn-editar');
                } else {
                    self.guardarTelefono(inputTelefono.val());
                }
            });
        },

        guardarTelefono: function (nuevoTelefono) {
            var self = this;
            Espo.Ajax.postRequest('CCustomerSurvey/action/actualizarTelefono', {
                surveyId:    this.surveyId,
                phoneNumber: nuevoTelefono
            })
                .then(function (response) {
                    if (response.success) {
                        Espo.Ui.success('Teléfono actualizado correctamente');
                        self.editandoTelefono = false;
                        self.$el.find('#input-telefono').prop('disabled', true);
                        self.$el.find('#btn-editar-telefono')
                            .html('<i class="fas fa-pencil-alt"></i>')
                            .attr('title', 'Editar teléfono')
                            .removeClass('btn-guardar').addClass('btn-editar');
                    } else {
                        Espo.Ui.error('Error al actualizar teléfono');
                    }
                })
                .catch(function (error) {
                    Espo.Ui.error('Error al actualizar teléfono: ' + error.message);
                });
        },

        ejecutarWorkflow: function () {
            var self = this;
            Espo.Ui.confirm('¿Desea enviar la encuesta?', function () {
                Espo.Ajax.postRequest('Workflow/action/runManualWorkflow', {
                    targetId:   self.surveyId,
                    workflowId: '689642aa335734383',
                    entityType: 'CCustomerSurvey'
                })
                    .then(function () { Espo.Ui.success('Encuesta enviada correctamente'); })
                    .catch(function (error) { Espo.Ui.error('Error al enviar encuesta: ' + error.message); });
            });
        }
    });
});