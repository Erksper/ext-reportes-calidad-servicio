<div class="container-fluid detalle-encuesta-container">
    <!-- Header -->
    <div class="row mb-4">
        <div class="col-md-12">
            <div class="page-header-card">
                <div class="d-flex justify-content-between align-items-center">
                    <div class="header-left">
                        <div class="header-icon">
                            <i class="fas fa-file-alt"></i>
                        </div>
                        <div class="header-content">
                            <h1 class="page-title">Detalle de Encuesta</h1>
                            <p class="page-subtitle" id="encuesta-numero">
                                Encuesta #<span id="numero-encuesta">...</span>
                            </p>
                        </div>
                    </div>
                    <div class="header-actions">
                        <button class="btn btn-volver" data-action="volver">
                            <i class="fas fa-arrow-left"></i>
                            <span>Volver a Lista</span>
                        </button>
                        <button class="btn btn-workflow" data-action="ejecutar-workflow">
                            <i class="fas fa-paper-plane"></i>
                            <span>Enviar Encuesta</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Leyenda de estados -->
    <div class="row mb-3">
        <div class="col-md-12">
            <div class="leyenda-estados">
                <span class="leyenda-titulo">
                    <i class="fas fa-question-circle me-2"></i>
                    <strong>Leyenda de Estados:</strong>
                </span>
                <div class="leyenda-items">
                    <span class="leyenda-badge" style="background: #3498db;" title="No se ha enviado el mensaje por algún problema en los datos">No enviado</span>
                    <span class="leyenda-badge" style="background: #f39c12;" title="Mensaje enviado a la espera de que el cliente complete la encuesta">Enviado</span>
                    <span class="leyenda-badge" style="background: #27ae60;" title="Encuesta completada por el usuario">Completado</span>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Contenido dinámico -->
    <div id="detalle-container">
        <div class="text-center" style="padding: 80px 20px;">
            <div class="spinner-large"></div>
            <h4 class="mt-4">Cargando detalles...</h4>
        </div>
    </div>
</div>

<style>
.detalle-encuesta-container {
    padding: 30px;
    background-color: #F5F5F5;
    min-height: 100vh;
}

.page-header-card {
    background: #FFFFFF;
    border-radius: 12px;
    padding: 30px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    border: 1px solid #E6E6E6;
}

.header-left {
    display: flex;
    align-items: center;
    gap: 20px;
}

.header-icon {
    width: 60px;
    height: 60px;
    background: #B8A279;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 28px;
}

.page-title {
    color: #1A1A1A;
    font-weight: 700;
    font-size: 32px;
    margin: 0;
}

.page-subtitle {
    color: #666666;
    font-size: 16px;
    margin: 8px 0 0 0;
}

.header-actions {
    display: flex;
    gap: 15px;
    align-items: center;
}

.btn-volver {
    background: #B8A279;
    color: white;
    border: 2px solid #B8A279;
    border-radius: 8px;
    padding: 12px 24px;
    font-weight: 600;
    font-size: 14px;
    transition: all 0.3s ease;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 10px;
}

.btn-volver:hover {
    background: #9D8B5F;
    border-color: #9D8B5F;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(184, 162, 121, 0.3);
}

.btn-workflow {
    background: #B8A279;
    color: white;
    border: 2px solid #B8A279;
    border-radius: 8px;
    padding: 12px 24px;
    font-weight: 600;
    font-size: 14px;
    transition: all 0.3s ease;
    cursor: pointer;
    display: none;
    align-items: center;
    gap: 10px;
}

.btn-workflow:hover {
    background: #9D8B5F;
    border-color: #9D8B5F;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(184, 162, 121, 0.3);
}

/* Leyenda de estados */
.leyenda-estados {
    background: white;
    padding: 15px 20px;
    border-radius: 8px;
    border: 1px solid #E6E6E6;
    display: flex;
    align-items: center;
    gap: 20px;
    flex-wrap: wrap;
}

.leyenda-titulo {
    color: #363438;
    font-size: 14px;
}

.leyenda-items {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
}

.leyenda-badge {
    color: white;
    padding: 6px 12px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
    cursor: help;
    transition: transform 0.2s ease;
}

.leyenda-badge:hover {
    transform: scale(1.05);
}

/* Estilos para campo editable */
.campo-editable {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 10px;
}

.campo-editable input {
    padding: 8px 12px;
    border: 2px solid #E6E6E6;
    border-radius: 6px;
    font-size: 16px;
    font-weight: 500;
    transition: all 0.3s ease;
}

.campo-editable input:focus {
    border-color: #B8A279;
    outline: none;
    box-shadow: 0 0 0 3px rgba(184, 162, 121, 0.1);
}

.campo-editable input:disabled {
    background: transparent;
    border: none;
    padding: 0;
    color: #1A1A1A;
}

.btn-editar,
.btn-guardar {
    background: #B8A279;
    color: white;
    border: none;
    width: 32px;
    height: 32px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
}

.btn-editar:hover,
.btn-guardar:hover {
    background: #9D8B5F;
    transform: scale(1.1);
}

.url-field {
    background: #F5F5F5;
    padding: 12px 15px;
    border-radius: 6px;
    border-left: 3px solid #B8A279;
    display: flex;
    align-items: center;
    gap: 10px;
}

.url-text {
    flex: 1;
    font-family: 'Courier New', monospace;
    font-size: 14px;
    color: #363438;
    word-break: break-all;
}

.btn-copiar {
    background: #B8A279;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s ease;
    white-space: nowrap;
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 6px;
}

.btn-copiar:hover {
    background: #9D8B5F;
    transform: scale(1.05);
}

/* Cards de información */
.info-card {
    background: white;
    border-radius: 12px;
    padding: 25px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    border: 1px solid #E6E6E6;
    margin-bottom: 20px;
}

.info-card-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 2px solid #B8A279;
}

.info-card-icon {
    color: #B8A279;
    font-size: 20px;
}

.info-card-title {
    color: #1A1A1A;
    font-weight: 600;
    font-size: 18px;
    margin: 0;
}

.info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
}

.info-item {
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.info-label {
    font-weight: 600;
    color: #666666;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.info-value {
    color: #1A1A1A;
    font-size: 16px;
    font-weight: 500;
}

/* Calificaciones */
.calificaciones-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 15px;
}

.calificacion-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 15px;
    background: #F5F5F5;
    border-radius: 8px;
    border-left: 4px solid #B8A279;
}

.calificacion-label {
    font-size: 14px;
    color: #363438;
    font-weight: 500;
}

.calificacion-valor {
    display: flex;
    align-items: center;
    gap: 8px;
}

.estrellas {
    color: #B8A279;
    font-size: 16px;
}

/* Comentarios */
.comentario-box {
    background: #F5F5F5;
    border-left: 4px solid #B8A279;
    padding: 20px;
    border-radius: 8px;
    font-style: italic;
    color: #363438;
    line-height: 1.6;
}

/* Spinner */
.spinner-large {
    width: 60px;
    height: 60px;
    border: 4px solid #E6E6E6;
    border-top: 4px solid #B8A279;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

/* Responsive */
@media (max-width: 768px) {
    .detalle-encuesta-container {
        padding: 15px;
    }
    
    .header-left {
        flex-direction: column;
        text-align: center;
    }
    
    .header-actions {
        flex-direction: column;
        width: 100%;
    }
    
    .header-actions button {
        width: 100%;
        justify-content: center;
    }
    
    .page-title {
        font-size: 24px;
    }
    
    .info-grid,
    .calificaciones-grid {
        grid-template-columns: 1fr;
    }
}
</style>