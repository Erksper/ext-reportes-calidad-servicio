define("reportes-calidad-servicio:views/lista", [
    "view",
    "reportes-calidad-servicio:views/modules/permisos",
], function (Dep, PermisosManager) {
    return Dep.extend({
        template: "reportes-calidad-servicio:lista",

        setup: function () {
            this.permisosManager = new PermisosManager(this);

            // Leer filtros desde la URL
            this.filtrosDesdeUrl = this.parseQueryParams();

            this.filtros = {
                cla:        this.filtrosDesdeUrl.cla        || null,
                oficina:    this.filtrosDesdeUrl.oficina    || null,
                asesor:     this.filtrosDesdeUrl.asesor     || null,
                estatus:    this.filtrosDesdeUrl.estatus    || null,
                fechaDesde: this.filtrosDesdeUrl.fechaDesde || null,
                fechaHasta: this.filtrosDesdeUrl.fechaHasta || null
            };

            this.encuestasFiltradas = [];
            this.paginacion = {
                pagina:       parseInt(this.filtrosDesdeUrl.pagina || 1),
                porPagina:    25,
                total:        0,
                totalPaginas: 0
            };
            this.cargandoPagina = false;

            this.cargarPermisos();
        },

        // ── URL helpers ──────────────────────────────────────────
        parseQueryParams: function () {
            var hash = window.location.hash;
            var result = { cla: null, oficina: null, asesor: null,
                           estatus: null, fechaDesde: null, fechaHasta: null, pagina: 1 };
            if (hash && hash.includes('?')) {
                var qs     = hash.split('?')[1];
                var params = new URLSearchParams(qs);
                result.cla        = params.get('cla')        || null;
                result.oficina    = params.get('oficina')    || null;
                result.asesor     = params.get('asesor')     || null;
                result.estatus    = params.get('estatus')    || null;
                result.fechaDesde = params.get('fechaDesde') || null;
                result.fechaHasta = params.get('fechaHasta') || null;
                result.pagina     = params.get('pagina') ? parseInt(params.get('pagina'), 10) : 1;
            }
            return result;
        },

        actualizarUrlConFiltros: function () {
            var qp = [];
            if (this.filtros.cla)        qp.push('cla='        + encodeURIComponent(this.filtros.cla));
            if (this.filtros.oficina)     qp.push('oficina='    + encodeURIComponent(this.filtros.oficina));
            if (this.filtros.asesor)      qp.push('asesor='     + encodeURIComponent(this.filtros.asesor));
            if (this.filtros.estatus)     qp.push('estatus='    + encodeURIComponent(this.filtros.estatus));
            if (this.filtros.fechaDesde)  qp.push('fechaDesde=' + encodeURIComponent(this.filtros.fechaDesde));
            if (this.filtros.fechaHasta)  qp.push('fechaHasta=' + encodeURIComponent(this.filtros.fechaHasta));
            if (this.paginacion.pagina > 1) qp.push('pagina='  + this.paginacion.pagina);
            var qs  = qp.length > 0 ? '?' + qp.join('&') : '';
            this.getRouter().navigate('#Lista' + qs, { trigger: false });
        },

        // ── Carga inicial ────────────────────────────────────────
        cargarPermisos: function () {
            this.permisosManager.cargarPermisosUsuario()
                .then(function (permisos) {
                    this.permisos = permisos;
                    // Restaurar valores simples en DOM si ya está renderizado
                    this.$el.find('#filtro-estatus').val(this.filtros.estatus || '');
                    this.$el.find('#filtro-fecha-desde').val(this.filtros.fechaDesde || '');
                    this.$el.find('#filtro-fecha-hasta').val(this.filtros.fechaHasta || '');

                    return this.cargarFiltros();
                }.bind(this))
                .then(function () {
                    return this.aplicarValoresFiltrosDesdeUrl();
                }.bind(this))
                .then(function () {
                    this.fetchEncuestas();
                }.bind(this))
                .catch(function (error) {
                    console.error("Error cargando permisos:", error);
                    this.fetchEncuestas();
                }.bind(this));
        },

        afterRender: function () {
            this.setupEventListeners();
        },

        setupEventListeners: function () {
            var self = this;

            this.$el.find('[data-action="aplicar-filtros"]').on('click', function () {
                self.paginacion.pagina = 1;
                self.aplicarFiltros();
            });

            this.$el.find('[data-action="limpiar-filtros"]').on('click', function () {
                self.limpiarFiltros();
            });

            this.$el.find('#filtro-cla').on('change', function (e) {
                self.onCLAChange($(e.currentTarget).val());
            });

            this.$el.find('#filtro-oficina').on('change', function (e) {
                self.onOficinaChange($(e.currentTarget).val());
            });
        },

        // ── Restaurar filtros desde URL ──────────────────────────
        aplicarValoresFiltrosDesdeUrl: function () {
            var self = this;
            return new Promise(function (resolve) {
                // Primero CLA
                if (self.filtros.cla) {
                    var checkCLA = function () {
                        var $s = self.$el.find('#filtro-cla');
                        if ($s.find('option[value="' + self.filtros.cla + '"]').length) {
                            $s.val(self.filtros.cla);
                            self.onCLAChange(self.filtros.cla).then(function () {
                                if (self.filtros.oficina) {
                                    self.aplicarOficinaDesdeUrl().then(resolve);
                                } else {
                                    resolve();
                                }
                            });
                        } else {
                            setTimeout(checkCLA, 100);
                        }
                    };
                    checkCLA();
                } else if (self.filtros.oficina) {
                    self.aplicarOficinaDesdeUrl().then(resolve);
                } else {
                    resolve();
                }
            });
        },

        aplicarOficinaDesdeUrl: function () {
            var self = this;
            return new Promise(function (resolve) {
                if (!self.filtros.oficina) { resolve(); return; }
                var checkOficina = function () {
                    var $s = self.$el.find('#filtro-oficina');
                    if ($s.find('option[value="' + self.filtros.oficina + '"]').length) {
                        $s.val(self.filtros.oficina);
                        self.onOficinaChange(self.filtros.oficina).then(function () {
                            if (self.filtros.asesor) self.aplicarAsesorDesdeUrl();
                            resolve();
                        });
                    } else {
                        setTimeout(checkOficina, 100);
                    }
                };
                checkOficina();
            });
        },

        aplicarAsesorDesdeUrl: function () {
            var self = this;
            if (!self.filtros.asesor) return;
            var checkAsesor = function () {
                var $s = self.$el.find('#filtro-asesor');
                if ($s.find('option[value="' + self.filtros.asesor + '"]').length) {
                    $s.val(self.filtros.asesor);
                } else {
                    setTimeout(checkAsesor, 100);
                }
            };
            checkAsesor();
        },

        // ── Filtros en cascada ───────────────────────────────────
        cargarFiltros: function () {
            var permisos = this.permisos;
            var self     = this;

            return new Promise(function (resolve) {
                if (!permisos) { resolve(); return; }

                if (permisos.esCasaNacional || permisos.esAdministrativo) {
                    self.cargarTodosCLAs().then(resolve);

                } else if (permisos.esGerente || permisos.esDirector || permisos.esCoordinador) {
                    // Bloquear CLA y oficina, cargar asesores de su oficina
                    if (permisos.claUsuario) {
                        self.$el.find('#filtro-cla')
                            .html('<option value="' + permisos.claUsuario + '">' + (permisos.claNombre || permisos.claUsuario) + '</option>')
                            .prop('disabled', true);
                    }
                    if (permisos.oficinaUsuario) {
                        self.$el.find('#filtro-oficina')
                            .html('<option value="' + permisos.oficinaUsuario + '">Cargando...</option>')
                            .prop('disabled', true);

                        Espo.Ajax.getRequest("CCustomerSurvey/action/getInfoOficina", {
                            oficinaId: permisos.oficinaUsuario
                        }).then(function (r) {
                            if (r.success) {
                                self.$el.find('#filtro-oficina')
                                    .html('<option value="' + permisos.oficinaUsuario + '">' + r.data.nombreOficina + '</option>');
                            }
                        });

                        self.filtros.oficina = permisos.oficinaUsuario;
                        self.cargarAsesoresPorOficina(permisos.oficinaUsuario).then(resolve);
                    } else {
                        resolve();
                    }

                } else if (permisos.esAsesorRegular) {
                    self.$el.find('#filtro-cla').html('<option value="">—</option>').prop('disabled', true);
                    self.$el.find('#filtro-oficina').html('<option value="">Mi oficina</option>').prop('disabled', true);
                    self.$el.find('#filtro-asesor')
                        .html('<option value="' + permisos.usuarioId + '" selected>Mis encuestas</option>')
                        .prop('disabled', true);
                    self.filtros.asesor = permisos.usuarioId;
                    resolve();
                } else {
                    self.cargarTodosCLAs().then(resolve);
                }
            });
        },

        cargarTodosCLAs: function () {
            var self = this;
            return new Promise(function (resolve) {
                Espo.Ajax.getRequest("CCustomerSurvey/action/getCLAs")
                    .then(function (response) {
                        if (response.success) self.poblarSelectCLAs(response.data);
                        resolve();
                    })
                    .catch(function () { resolve(); });
            });
        },

        poblarSelectCLAs: function (clas) {
            var select = this.$el.find('#filtro-cla');
            select.empty().append('<option value="">Todos los CLAs</option>');
            clas.forEach(function (cla) {
                select.append('<option value="' + cla.id + '">' + cla.name + '</option>');
            });
        },

        onCLAChange: function (claId) {
            var self = this;
            return new Promise(function (resolve) {
                var $of = self.$el.find('#filtro-oficina');
                var $as = self.$el.find('#filtro-asesor');
                if (!claId) {
                    $of.html('<option value="">Seleccione un CLA primero</option>').prop('disabled', true);
                    $as.html('<option value="">Seleccione una oficina primero</option>').prop('disabled', true);
                    resolve(); return;
                }
                $of.html('<option value="">Cargando...</option>').prop('disabled', true);
                $as.html('<option value="">Seleccione una oficina primero</option>').prop('disabled', true);

                Espo.Ajax.getRequest("CCustomerSurvey/action/getOficinasByCLA", { claId: claId })
                    .then(function (response) {
                        if (response.success) self.poblarSelectOficinas(response.data);
                        resolve();
                    })
                    .catch(function () { resolve(); });
            });
        },

        poblarSelectOficinas: function (oficinas) {
            var select = this.$el.find('#filtro-oficina');
            select.empty().append('<option value="">Todas las oficinas</option>');
            oficinas.forEach(function (o) {
                select.append('<option value="' + o.id + '">' + o.name + '</option>');
            });
            select.prop('disabled', false);
        },

        onOficinaChange: function (oficinaId) {
            var self = this;
            return new Promise(function (resolve) {
                var $as = self.$el.find('#filtro-asesor');
                if (!oficinaId) {
                    $as.html('<option value="">Seleccione una oficina primero</option>').prop('disabled', true);
                    resolve(); return;
                }
                $as.html('<option value="">Cargando...</option>').prop('disabled', true);
                self.cargarAsesoresPorOficina(oficinaId).then(resolve);
            });
        },

        cargarAsesoresPorOficina: function (oficinaId) {
            var self = this;
            return new Promise(function (resolve) {
                Espo.Ajax.getRequest("CCustomerSurvey/action/getAsesoresByOficina", {
                    oficinaId: oficinaId
                })
                    .then(function (response) {
                        if (response.success) self.poblarSelectAsesores(response.data);
                        resolve();
                    })
                    .catch(function () {
                        self.$el.find('#filtro-asesor')
                            .html('<option value="">Error al cargar asesores</option>')
                            .prop('disabled', false);
                        resolve();
                    });
            });
        },

        poblarSelectAsesores: function (asesores) {
            var select = this.$el.find('#filtro-asesor');
            select.empty().append('<option value="">Todos los asesores</option>');

            // Filtrar admin y "Por La Casa", normalizar nombres
            var excluidos = ['admin', 'por la casa'];
            asesores
                .filter(function (a) {
                    var nombre = (a.name || '').toLowerCase().trim();
                    var login  = (a.userName || a.user_name || '').toLowerCase().trim();
                    return !excluidos.includes(nombre) && login !== 'admin';
                })
                .forEach(function (a) {
                    // Normalizar a Title Case
                    var nombre = (a.name || '').toLowerCase().replace(/\b\w/g, function (c) {
                        return c.toUpperCase();
                    });
                    select.append('<option value="' + a.id + '">' + nombre + '</option>');
                });

            select.prop('disabled', false);
        },

        // ── Aplicar / Limpiar filtros ────────────────────────────
        aplicarFiltros: function () {
            this.filtros = {
                cla:        this.$el.find('#filtro-cla').val()          || null,
                oficina:    this.$el.find('#filtro-oficina').val()      || null,
                asesor:     this.$el.find('#filtro-asesor').val()       || null,
                estatus:    this.$el.find('#filtro-estatus').val()      || null,
                fechaDesde: this.$el.find('#filtro-fecha-desde').val()  || null,
                fechaHasta: this.$el.find('#filtro-fecha-hasta').val()  || null
            };

            // Respetar restricciones de rol
            var p = this.permisos;
            if (p) {
                if (p.esAsesorRegular) {
                    this.filtros.asesor  = p.usuarioId;
                    this.filtros.cla     = null;
                    this.filtros.oficina = null;
                } else if ((p.esGerente || p.esDirector || p.esCoordinador) && !p.esCasaNacional) {
                    this.filtros.oficina = p.oficinaUsuario;
                    this.filtros.cla     = null;
                }
            }

            this.paginacion.pagina = 1;
            this.actualizarUrlConFiltros();
            this.fetchEncuestas();
        },

        limpiarFiltros: function () {
            this.$el.find('#filtro-cla').val('');
            this.$el.find('#filtro-oficina').val('').prop('disabled', true)
                .html('<option value="">Seleccione un CLA primero</option>');
            this.$el.find('#filtro-asesor').val('').prop('disabled', true)
                .html('<option value="">Seleccione una oficina primero</option>');
            this.$el.find('#filtro-estatus').val('');
            this.$el.find('#filtro-fecha-desde').val('');
            this.$el.find('#filtro-fecha-hasta').val('');

            this.filtros = { cla: null, oficina: null, asesor: null,
                             estatus: null, fechaDesde: null, fechaHasta: null };
            this.paginacion.pagina = 1;
            this.actualizarUrlConFiltros();
            this.fetchEncuestas();
            Espo.Ui.info("Filtros limpiados");
        },

        // ── Fetch paginado ───────────────────────────────────────
        fetchEncuestas: function () {
            if (this.cargandoPagina) return;
            this.cargandoPagina = true;

            var container = this.$el.find('#lista-container');
            container.html(
                '<div class="text-center" style="padding:80px 20px;">'
                + '<div class="spinner-large"></div>'
                + '<h4 class="mt-4">Cargando encuestas...</h4></div>'
            );

            var params = {
                pagina:    this.paginacion.pagina,
                porPagina: this.paginacion.porPagina
            };
            if (this.filtros.cla)        params.claId      = this.filtros.cla;
            if (this.filtros.oficina)     params.oficinaId  = this.filtros.oficina;
            if (this.filtros.asesor)      params.asesorId   = this.filtros.asesor;
            if (this.filtros.estatus)     params.estatus    = this.filtros.estatus;
            if (this.filtros.fechaDesde)  params.fechaDesde = this.filtros.fechaDesde;
            if (this.filtros.fechaHasta)  params.fechaHasta = this.filtros.fechaHasta;

            // Restricciones automáticas por rol si no hay filtros manuales
            var p = this.permisos;
            if (p && !params.asesorId && !params.claId && !params.oficinaId) {
                if (p.esAsesorRegular) {
                    params.asesorId = p.usuarioId;
                } else if ((p.esGerente || p.esDirector || p.esCoordinador) && !p.esCasaNacional) {
                    if (p.oficinaUsuario) params.oficinaId = p.oficinaUsuario;
                }
            }

            var self = this;
            Espo.Ajax.getRequest("CCustomerSurvey/action/getEncuestas", params)
                .then(function (response) {
                    self.cargandoPagina = false;
                    if (response.success) {
                        self.encuestasFiltradas = response.data;
                        // Soporte paginación desde backend O paginación local
                        if (response.paginacion) {
                            self.paginacion.total        = response.paginacion.total;
                            self.paginacion.totalPaginas = response.paginacion.totalPaginas;
                        } else {
                            // Backend no pagina aún → paginar localmente
                            self.paginacion.total        = response.data.length;
                            self.paginacion.totalPaginas = Math.ceil(response.data.length / self.paginacion.porPagina);
                        }
                        self.renderizarTabla();
                    }
                })
                .catch(function () {
                    self.cargandoPagina = false;
                    container.html('<div class="alert alert-danger">Error al cargar encuestas</div>');
                });
        },

        irAPagina: function (pagina) {
            if (pagina < 1 || pagina > this.paginacion.totalPaginas || this.cargandoPagina) return;
            this.paginacion.pagina = pagina;
            this.actualizarUrlConFiltros();
            this.fetchEncuestas();
        },

        // ── Render ───────────────────────────────────────────────
        renderizarTabla: function () {
            var container = this.$el.find('#lista-container');
            var pag       = this.paginacion;

            // Si el backend no pagina, paginar localmente
            var datos = this.encuestasFiltradas;
            if (!this._backendPagina) {
                var inicio = (pag.pagina - 1) * pag.porPagina;
                datos = this.encuestasFiltradas.slice(inicio, inicio + pag.porPagina);
                pag.total        = this.encuestasFiltradas.length;
                pag.totalPaginas = Math.ceil(pag.total / pag.porPagina);
            }

            // Contador
            var ini = pag.total === 0 ? 0 : (pag.pagina - 1) * pag.porPagina + 1;
            var fin = Math.min(pag.pagina * pag.porPagina, pag.total);
            this.$el.find('#total-encuestas-mostradas')
                .text(pag.total === 0 ? '0' : ini + '–' + fin + ' de ' + pag.total);

            if (datos.length === 0) {
                container.html(
                    '<div class="no-data-card">'
                    + '<div class="no-data-icon"><i class="fas fa-inbox"></i></div>'
                    + '<h3 class="no-data-title">No hay encuestas</h3>'
                    + '<p class="no-data-text">No se encontraron encuestas con los filtros aplicados</p>'
                    + '</div>'
                );
                return;
            }

            var html = '';
            var self = this;
            var inicioGlobal = (pag.pagina - 1) * pag.porPagina;

            // Grupos de 25 dentro de la página
            var grupos = [];
            for (var g = 0; g < datos.length; g += 25) {
                grupos.push(datos.slice(g, g + 25));
            }

            grupos.forEach(function (grupo, gi) {
                var numGrupoGlobal = inicioGlobal + gi * 25 + 1;
                var numGrupoFin   = Math.min(numGrupoGlobal + 24, pag.total);

                html += '<div class="grupo-encuestas">';
                html += '<div class="grupo-header">';
                html += '<i class="fas fa-layer-group" style="margin-right:8px;"></i>';
                html += 'Registros ' + numGrupoGlobal + ' – ' + numGrupoFin;
                html += '</div>';
                html += '<div class="tabla-encuestas"><table><thead><tr>';
                html += '<th style="width:50px;text-align:center;">N°</th>';
                html += '<th style="width:90px;">Fecha</th>';
                html += '<th style="width:150px;">Cliente</th>';
                html += '<th style="width:120px;">Teléfono</th>';
                html += '<th style="width:180px;">Asesor</th>';
                html += '<th style="width:100px;">Operación</th>';
                html += '<th style="width:120px;">Estado</th>';
                html += '<th style="width:100px;">Reenvíos</th>';
                html += '<th style="width:80px;">Acciones</th>';
                html += '</tr></thead><tbody>';

                grupo.forEach(function (encuesta, idx) {
                    var numItem = inicioGlobal + gi * 25 + idx + 1;
                    var fecha    = encuesta.createdAt
                        ? new Date(encuesta.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' })
                        : '-';
                    var reenvios = encuesta.reenvios || 0;
                    var telefono = encuesta.phoneNumber || '-';

                    // Normalizar a Title Case
                    var clienteFull = self.titleCase(encuesta.clientName   || '');
                    var asesorFull  = self.titleCase(encuesta.asesorNombre || '');
                    var clienteCorto = clienteFull.length > 20 ? clienteFull.substring(0, 17) + '...' : clienteFull;
                    var asesorCorto  = asesorFull.length  > 25 ? asesorFull.substring(0, 22)  + '...' : asesorFull;

                    var estatusMap = {
                        '0': { texto: 'No enviado', color: '#3498db' },
                        '1': { texto: 'Enviado',    color: '#f39c12' },
                        '2': { texto: 'Completado', color: '#27ae60' }
                    };
                    var ei = estatusMap[encuesta.estatus] || { texto: 'Desconocido', color: '#95a5a6' };

                    html += '<tr data-id="' + encuesta.id + '">';
                    html += '<td style="text-align:center;font-weight:600;font-size:13px;">' + numItem + '</td>';
                    html += '<td style="font-size:13px;">' + fecha + '</td>';
                    html += '<td title="' + clienteFull + '" style="font-size:13px;">' + clienteCorto + '</td>';
                    html += '<td style="font-size:13px;">' + telefono + '</td>';
                    html += '<td title="' + asesorFull  + '" style="font-size:13px;">' + asesorCorto  + '</td>';
                    html += '<td style="font-size:13px;">' + (encuesta.operationType || '-') + '</td>';
                    html += '<td><span class="badge" style="background:' + ei.color + ';color:white;font-size:11px;padding:4px 8px;">' + ei.texto + '</span></td>';
                    html += '<td style="text-align:center;"><span style="font-weight:600;color:#666;font-size:13px;">' + reenvios + '</span></td>';
                    html += '<td style="text-align:center;"><button class="btn-ver" data-id="' + encuesta.id + '" title="Ver encuesta"><i class="fas fa-eye"></i></button></td>';
                    html += '</tr>';
                });

                html += '</tbody></table></div></div>'; // cierra grupo
            });

            // Paginación
            html += self.renderPaginacion();

            container.html(html);

            // Eventos
            container.find('tr[data-id]').on('click', function (e) {
                if (!$(e.target).closest('button').length) {
                    self.verDetalle($(this).data('id'));
                }
            });
            container.find('.btn-view').on('click', function (e) {
                e.stopPropagation();
                self.verDetalle($(this).data('id'));
            });
            container.find('.pag-btn').on('click', function () {
                var p = parseInt($(this).data('pagina'), 10);
                if (!isNaN(p)) self.irAPagina(p);
            });
        },

        renderPaginacion: function () {
            var pag = this.paginacion;
            if (pag.totalPaginas <= 1) return '';

            var actual = pag.pagina;
            var total  = pag.totalPaginas;
            var pages  = [];
            var rango  = 2;
            var ini    = Math.max(2, actual - rango);
            var fin    = Math.min(total - 1, actual + rango);

            pages.push(1);
            if (ini > 2)       pages.push('...');
            for (var i = ini; i <= fin; i++) pages.push(i);
            if (fin < total - 1) pages.push('...');
            if (total > 1)     pages.push(total);

            var html = '<div class="paginacion-container">';
            html += '<div class="paginacion-info">Página ' + actual + ' de ' + total + '</div>';
            html += '<div class="paginacion-controles">';

            html += '<button class="pag-btn pag-nav' + (actual <= 1 ? ' disabled' : '') + '" data-pagina="' + (actual - 1) + '"' + (actual <= 1 ? ' disabled' : '') + '>'
                  + '<i class="fas fa-chevron-left"></i></button>';

            pages.forEach(function (p) {
                if (p === '...') {
                    html += '<span class="pag-ellipsis">…</span>';
                } else {
                    html += '<button class="pag-btn' + (p === actual ? ' pag-activo' : '') + '" data-pagina="' + p + '">' + p + '</button>';
                }
            });

            html += '<button class="pag-btn pag-nav' + (actual >= total ? ' disabled' : '') + '" data-pagina="' + (actual + 1) + '"' + (actual >= total ? ' disabled' : '') + '>'
                  + '<i class="fas fa-chevron-right"></i></button>';

            html += '</div></div>';
            return html;
        },

        // Normalizar texto a Title Case
        titleCase: function (str) {
            if (!str) return '';
            return str.toLowerCase().replace(/\b\w/g, function (c) { return c.toUpperCase(); });
        },

        // Navegar a detalle pasando filtros en la URL
        verDetalle: function (surveyId) {
            var qp = [];
            if (this.filtros.cla)        qp.push('cla='        + encodeURIComponent(this.filtros.cla));
            if (this.filtros.oficina)     qp.push('oficina='    + encodeURIComponent(this.filtros.oficina));
            if (this.filtros.asesor)      qp.push('asesor='     + encodeURIComponent(this.filtros.asesor));
            if (this.filtros.estatus)     qp.push('estatus='    + encodeURIComponent(this.filtros.estatus));
            if (this.filtros.fechaDesde)  qp.push('fechaDesde=' + encodeURIComponent(this.filtros.fechaDesde));
            if (this.filtros.fechaHasta)  qp.push('fechaHasta=' + encodeURIComponent(this.filtros.fechaHasta));
            if (this.paginacion.pagina > 1) qp.push('pagina='  + this.paginacion.pagina);
            var qs = qp.length > 0 ? '?' + qp.join('&') : '';
            this.getRouter().navigate('#Lista/detalle/' + surveyId + qs, { trigger: true });
        }
    });
});