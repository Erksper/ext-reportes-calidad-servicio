define("reportes-calidad-servicio:views/lista", [
    "view",
    "reportes-calidad-servicio:views/modules/permisos",
], function (Dep, PermisosManager) {
    return Dep.extend({
        template: "reportes-calidad-servicio:lista",

        setup: function () {
            this.permisosManager = new PermisosManager(this);
            this.filtros = {
                cla: null,
                oficina: null,
                asesor: null,
                estatus: null,
                fechaDesde: null,
                fechaHasta: null
            };
            this.encuestas = [];
            this.encuestasFiltradas = [];
            
            this.cargarPermisos();
        },

        cargarPermisos: function () {
            this.permisosManager.cargarPermisosUsuario()
                .then(function () {
                    this.cargarFiltros();
                    this.cargarEncuestas();
                }.bind(this))
                .catch(function (error) {
                    console.error("Error cargando permisos:", error);
                    this.cargarEncuestas();
                }.bind(this));
        },

        afterRender: function () {
            this.setupEventListeners();
        },

        setupEventListeners: function () {
            // Aplicar filtros
            this.$el.find('[data-action="aplicar-filtros"]').on('click', function () {
                this.aplicarFiltros();
            }.bind(this));

            // Limpiar filtros
            this.$el.find('[data-action="limpiar-filtros"]').on('click', function () {
                this.limpiarFiltros();
            }.bind(this));

            // Filtros en cascada
            this.$el.find('#filtro-cla').on('change', function (e) {
                this.onCLAChange($(e.currentTarget).val());
            }.bind(this));

            this.$el.find('#filtro-oficina').on('change', function (e) {
                this.onOficinaChange($(e.currentTarget).val());
            }.bind(this));
        },

        cargarFiltros: function () {
            // Cargar CLAs
            Espo.Ajax.getRequest("CCustomerSurvey/action/getCLAs")
                .then(function (response) {
                    if (response.success) {
                        this.poblarSelectCLAs(response.data);
                    }
                }.bind(this));
        },

        poblarSelectCLAs: function (clas) {
            var select = this.$el.find('#filtro-cla');
            select.empty();
            select.append('<option value="">Todos los CLAs</option>');
            
            clas.forEach(function (cla) {
                select.append('<option value="' + cla.id + '">' + cla.name + '</option>');
            });
        },

        onCLAChange: function (claId) {
            var selectOficina = this.$el.find('#filtro-oficina');
            var selectAsesor = this.$el.find('#filtro-asesor');
            
            selectOficina.html('<option value="">Cargando...</option>').prop('disabled', true);
            selectAsesor.html('<option value="">Seleccione una oficina primero</option>').prop('disabled', true);
            
            if (!claId) {
                selectOficina.html('<option value="">Seleccione un CLA primero</option>');
                return;
            }
            
            Espo.Ajax.getRequest("CCustomerSurvey/action/getOficinasByCLA", { claId: claId })
                .then(function (response) {
                    if (response.success) {
                        this.poblarSelectOficinas(response.data);
                    }
                }.bind(this));
        },

        poblarSelectOficinas: function (oficinas) {
            var select = this.$el.find('#filtro-oficina');
            select.empty();
            select.append('<option value="">Todas las oficinas</option>');
            
            oficinas.forEach(function (oficina) {
                select.append('<option value="' + oficina.id + '">' + oficina.name + '</option>');
            });
            
            select.prop('disabled', false);
        },

        onOficinaChange: function (oficinaId) {
            var selectAsesor = this.$el.find('#filtro-asesor');
            
            selectAsesor.html('<option value="">Cargando...</option>').prop('disabled', true);
            
            if (!oficinaId) {
                selectAsesor.html('<option value="">Seleccione una oficina primero</option>');
                return;
            }
            
            Espo.Ajax.getRequest("CCustomerSurvey/action/getAsesoresByOficina", { oficinaId: oficinaId })
                .then(function (response) {
                    if (response.success) {
                        this.poblarSelectAsesores(response.data);
                    }
                }.bind(this));
        },

        poblarSelectAsesores: function (asesores) {
            var select = this.$el.find('#filtro-asesor');
            select.empty();
            select.append('<option value="">Todos los asesores</option>');
            
            asesores.forEach(function (asesor) {
                select.append('<option value="' + asesor.id + '">' + asesor.name + '</option>');
            });
            
            select.prop('disabled', false);
        },

        cargarEncuestas: function () {
            var container = this.$el.find('#lista-container');
            
            Espo.Ajax.getRequest("CCustomerSurvey/action/getEncuestas")
                .then(function (response) {
                    if (response.success) {
                        this.encuestas = response.data;
                        this.encuestasFiltradas = this.encuestas;
                        this.renderizarTabla();
                    }
                }.bind(this))
                .catch(function (error) {
                    container.html('<div class="alert alert-danger">Error al cargar encuestas</div>');
                });
        },

        cargarEncuestasFiltradas: function () {
            var container = this.$el.find('#lista-container');
            
            // Construir parámetros de filtro
            var params = {};
            if (this.filtros.cla) params.claId = this.filtros.cla;
            if (this.filtros.oficina) params.oficinaId = this.filtros.oficina;
            if (this.filtros.asesor) params.asesorId = this.filtros.asesor;
            if (this.filtros.estatus) params.estatus = this.filtros.estatus;
            if (this.filtros.fechaDesde) params.fechaDesde = this.filtros.fechaDesde;
            if (this.filtros.fechaHasta) params.fechaHasta = this.filtros.fechaHasta;
            
            Espo.Ajax.getRequest("CCustomerSurvey/action/getEncuestas", params)
                .then(function (response) {
                    if (response.success) {
                        this.encuestasFiltradas = response.data;
                        this.renderizarTabla();
                        Espo.Ui.success("Filtros aplicados: " + this.encuestasFiltradas.length + " resultados");
                    }
                }.bind(this))
                .catch(function (error) {
                    Espo.Ui.error("Error al aplicar filtros");
                });
        },

        aplicarFiltros: function () {
            this.filtros = {
                cla: this.$el.find('#filtro-cla').val(),
                oficina: this.$el.find('#filtro-oficina').val(),
                asesor: this.$el.find('#filtro-asesor').val(),
                estatus: this.$el.find('#filtro-estatus').val(),
                fechaDesde: this.$el.find('#filtro-fecha-desde').val(),
                fechaHasta: this.$el.find('#filtro-fecha-hasta').val()
            };
            
            // ✅ CORRECCIÓN: Recargar encuestas con filtros aplicados en servidor
            this.cargarEncuestasFiltradas();
        },

        limpiarFiltros: function () {
            this.$el.find('#filtro-cla').val('');
            this.$el.find('#filtro-oficina').val('').prop('disabled', true).html('<option value="">Seleccione un CLA primero</option>');
            this.$el.find('#filtro-asesor').val('').prop('disabled', true).html('<option value="">Seleccione una oficina primero</option>');
            this.$el.find('#filtro-estatus').val('');
            this.$el.find('#filtro-fecha-desde').val('');
            this.$el.find('#filtro-fecha-hasta').val('');
            
            this.filtros = {
                cla: null,
                oficina: null,
                asesor: null,
                estatus: null,
                fechaDesde: null,
                fechaHasta: null
            };
            
            this.cargarEncuestas();
            Espo.Ui.info("Filtros limpiados");
        },

        renderizarTabla: function () {
            var container = this.$el.find('#lista-container');
            
            this.$el.find('#total-mostrados').text(this.encuestasFiltradas.length);
            this.$el.find('#total-encuestas').text(this.encuestas.length);
            
            if (this.encuestasFiltradas.length === 0) {
                container.html('<div class="no-data-card"><div class="no-data-icon"><i class="fas fa-inbox"></i></div><h3 class="no-data-title">No hay encuestas</h3><p class="no-data-text">No se encontraron encuestas con los filtros aplicados</p></div>');
                return;
            }
            
            var html = '<div class="tabla-encuestas"><table><thead><tr>';
            html += '<th>Fecha</th>';
            html += '<th>Cliente</th>';
            html += '<th>Asesor</th>';
            html += '<th>Operación</th>';
            html += '<th>Calificación</th>';
            html += '<th>Recomendación</th>';
            html += '<th>Estatus</th>';
            html += '<th>Reenvíos</th>';
            html += '<th>Acciones</th>';
            html += '</tr></thead><tbody>';
            
            this.encuestasFiltradas.forEach(function (encuesta) {
                var fecha = encuesta.createdAt ? new Date(encuesta.createdAt).toLocaleDateString('es-ES') : '-';
                var calificacion = encuesta.generalAdvisorRating || '-';
                var recomendacion = encuesta.recommendation === '1' ? '✓ Sí' : '✗ No';
                var reenvios = encuesta.reenvios || 0;
                
                // Estatus
                var estatusMap = {
                    '0': { texto: 'Pendiente', color: '#3498db' },
                    '1': { texto: 'En Proceso', color: '#f39c12' },
                    '2': { texto: 'Completada', color: '#27ae60' },
                    '3': { texto: 'Cancelada', color: '#e74c3c' }
                };
                var estatusInfo = estatusMap[encuesta.estatus] || { texto: 'Desconocido', color: '#95a5a6' };
                
                html += '<tr data-id="' + encuesta.id + '" style="cursor: pointer;">';
                html += '<td>' + fecha + '</td>';
                html += '<td>' + (encuesta.clientName || '-') + '</td>';
                html += '<td>' + (encuesta.asesorNombre || '-') + '</td>';
                html += '<td>' + (encuesta.operationType || '-') + '</td>';
                html += '<td><span class="badge" style="background: #B8A279; color: white;">' + calificacion + '/5</span></td>';
                html += '<td>' + recomendacion + '</td>';
                html += '<td><span class="badge" style="background: ' + estatusInfo.color + '; color: white;">' + estatusInfo.texto + '</span></td>';
                html += '<td><span style="font-weight: 600; color: #666;">' + reenvios + '</span></td>';
                html += '<td><button class="btn btn-sm btn-view" data-id="' + encuesta.id + '" style="background: #B8A279; color: white; border: none; padding: 5px 12px; border-radius: 4px; cursor: pointer;"><i class="fas fa-eye"></i> Ver</button></td>';
                html += '</tr>';
            }.bind(this));
            
            html += '</tbody></table></div>';
            
            container.html(html);
            
            // Event listeners para filas
            container.find('tr[data-id]').on('click', function (e) {
                if (!$(e.target).closest('button').length) {
                    var id = $(e.currentTarget).data('id');
                    this.verDetalle(id);
                }
            }.bind(this));
            
            // Event listeners para botones
            container.find('.btn-view').on('click', function (e) {
                e.stopPropagation();
                var id = $(e.currentTarget).data('id');
                this.verDetalle(id);
            }.bind(this));
        },

        verDetalle: function (surveyId) {
            this.getRouter().navigate("#Lista/detalle/" + surveyId, { trigger: true });
        }
    });
});