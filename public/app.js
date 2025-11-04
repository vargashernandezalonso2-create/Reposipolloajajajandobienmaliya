
let currentSlide = 0;
let totalSlides = 0;
let seasonalProducts = [];


function getCurrentSeason() {
    const today = new Date();
    const month = today.getMonth() + 1; 
    const day = today.getDate();
    
    console.log('📅 [DEBUG] Fecha actual:', month, '/', day);
    

    if ((month === 11 && day >= 6) || month === 12 || (month === 1 && day <= 9)) {
        console.log('🎄 [DEBUG] Temporada: Navidad');
        return 'navidad';
    } else {
        console.log('🎃 [DEBUG] Temporada: Halloween');
        return 'halloween';
    }
}


async function loadSeasonalProducts() {
    try {
        const season = getCurrentSeason();
        console.log('📄 [DEBUG] Cargando productos de temporada:', season);
        
        const response = await fetch(`http://localhost:3001/api/productos/temporada/${season}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        seasonalProducts = await response.json();
        totalSlides = seasonalProducts.length;
        
        console.log('✅ [DEBUG] Productos de temporada cargados:', seasonalProducts);
        
     
        const title = season === 'navidad' ? '🎄 Felices Fiestas 🎅' : '🎃 Feliz Halloween 🎃';
        document.getElementById('heroTitle').textContent = title;
        
       
        renderCarousel();
        
    } catch (error) {
        console.error('❌ [ERROR] Error cargando productos de temporada:', error);
    }
}


function renderCarousel() {
    const carouselInner = document.getElementById('carouselInner');
    const indicators = document.getElementById('carouselIndicators');
    
    if (!carouselInner || !indicators) {
        console.error('❌ [ERROR] No se encontraron elementos del carousel');
        return;
    }
    
   
    carouselInner.innerHTML = '';
    indicators.innerHTML = '';
    
  
    seasonalProducts.forEach((product, index) => {
        const slide = document.createElement('div');
        slide.className = 'carousel-item carousel-clickable';
        slide.setAttribute('data-product-image', product.image);
        slide.style.backgroundImage = `url('${product.image}')`;
        slide.style.backgroundSize = 'cover';
        slide.style.backgroundPosition = 'center';
        carouselInner.appendChild(slide);
        
        // aaa agregamos indicadores -bynd
        const indicator = document.createElement('span');
        indicator.className = index === 0 ? 'indicator active' : 'indicator';
        indicator.onclick = () => goToSlide(index);
        indicators.appendChild(indicator);
    });
    
    console.log('✅ [DEBUG] Carousel renderizado con', seasonalProducts.length, 'slides');
    

    setupCarouselClicks();
}

function moveCarousel(direction) {
    currentSlide += direction;
    
    if (currentSlide < 0) {
        currentSlide = totalSlides - 1;
    } else if (currentSlide >= totalSlides) {
        currentSlide = 0;
    }
    
    updateCarousel();
}

function goToSlide(index) {
    currentSlide = index;
    updateCarousel();
}


function updateCarousel() {
    const inner = document.getElementById('carouselInner');
    inner.style.transform = `translateX(-${currentSlide * 100}%)`;
    
    const indicators = document.querySelectorAll('.indicator');
    indicators.forEach((indicator, index) => {
        if (index === currentSlide) {
            indicator.classList.add('active');
        } else {
            indicator.classList.remove('active');
        }
    });
}


let autoplayInterval;

function startAutoplay() {
    if (autoplayInterval) clearInterval(autoplayInterval);
    autoplayInterval = setInterval(() => {
        moveCarousel(1);
    }, 5000);
}


function resetAutoplay() {
    startAutoplay();
}


let allProducts = [];

console.log('[DEBUG] Esperando productos del backend...');


async function loadProducts() {
    try {
        console.log('[DEBUG] Haciendo fetch a /api/productos...');
        const response = await fetch('http://localhost:3001/api/productos');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        allProducts = await response.json();
        console.log('[DEBUG] Productos cargados del backend:', allProducts.length);
        
        
        renderRandomProducts();
        
    } catch (error) {
        console.error('[ERROR] Error cargando productos:', error);
  
        const container = document.getElementById('randomProducts');
        if (container) {
            container.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; color: #d4a574; padding: 2rem;">
                    <h3>Error cargando productos</h3>
                    <p>No se pudo conectar con el servidor. Asegúrate de que esté corriendo.</p>
                </div>
            `;
        }
    }
}


async function getRandomProducts(count) {
    try {
        console.log('[DEBUG] Obteniendo productos aleatorios del backend...');
        const response = await fetch(`http://localhost:3001/api/productos/random/${count}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const products = await response.json();
        console.log('DEBUG] Productos aleatorios obtenidos (SIN especiales):', products.length);
        console.log('[DEBUG] Productos:', products.map(p => p.name));
        return products;
        
    } catch (error) {
        console.error('[ERROR] Error obteniendo productos aleatorios:', error);
        // chintrolas si falla usamos los productos cargados localmente -bynd
        if (allProducts.length > 0) {
            const nonSpecial = allProducts.filter(p => !p.es_especial);
            const shuffled = [...nonSpecial].sort(() => Math.random() - 0.5);
            return shuffled.slice(0, count);
        }
        return [];
    }
}


async function renderRandomProducts() {
    console.log('[DEBUG] Renderizando productos aleatorios...');
    const container = document.getElementById('randomProducts');
    
    if (!container) {
        console.error('[ERROR] No se encontró el contenedor randomProducts');
        return;
    }
    

    container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #d4a574;">Cargando productos...</div>';
    
    const randomProducts = await getRandomProducts(6);
    
    if (randomProducts.length === 0) {
        container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: #d4a574;">No hay productos disponibles</div>';
        return;
    }
    
    console.log('[DEBUG] Productos seleccionados:', randomProducts.map(p => p.name));
    
    container.innerHTML = randomProducts.map(product => `
        <div class="product-card" data-id="${product.id}" onclick="goToProduct(${product.id})" style="cursor: pointer;">
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}" onerror="this.parentElement.innerHTML='<span>Imagen del producto</span>'">
            </div>
            <h3>${product.name}</h3>
            <p>${product.desc}</p>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <p class="price">${product.price}</p>
                <p style="color: #c9a66b; font-size: 0.9rem;">Stock: ${product.stock}</p>
            </div>
        </div>
    `).join('');
    
    console.log('[DEBUG] Productos renderizados exitosamente');
}


function goToProduct(productId) {
    console.log('📄 [DEBUG] Navegando a producto:', productId);
    window.location.href = `producto.html?id=${productId}`;
}


let gearRotation = 0;
let isDragging = false;
let startAngle = 0;
let rotationStart = 0;
let totalRotation = 0;

console.log('[DEBUG] Variables del engranaje inicializadas');


function getAngle(e, element) {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
    const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;
    
    const angle = Math.atan2(clientY - centerY, clientX - centerX) * (180 / Math.PI);
    return angle;
}


function startDrag(e) {
    console.log('[DEBUG] Inicio de arrastre');
    e.preventDefault();
    isDragging = true;
    const gear = document.getElementById('interactiveGear');
    
    if (!gear) {
        console.error(' [ERROR] No se encontró el engranaje');
        return;
    }
    
    startAngle = getAngle(e, gear);
    rotationStart = gearRotation;
    console.log('[DEBUG] Ángulo inicial:', startAngle, 'Rotación inicial:', rotationStart);
}

function drag(e) {
    if (!isDragging) return;
    e.preventDefault();
    
    const gear = document.getElementById('interactiveGear');
    if (!gear) {
        console.error('❌ [ERROR] No se encontró el engranaje durante el arrastre');
        return;
    }
    
    const currentAngle = getAngle(e, gear);
    let delta = currentAngle - startAngle;
    

    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    
    gearRotation = rotationStart + delta;
    totalRotation = gearRotation;
    
    console.log('🔄 [DEBUG] Arrastrando - Delta:', delta.toFixed(2), 'Rotación total:', totalRotation.toFixed(2));
    
    gear.style.transform = `rotate(${gearRotation}deg)`;
}

function endDrag(e) {
    if (!isDragging) return;
    console.log('🛑 [DEBUG] Fin de arrastre - Rotación total:', totalRotation.toFixed(2));
    e.preventDefault();
    isDragging = false;
    

    if (Math.abs(totalRotation) >= 160) {
        console.log('🎉 [DEBUG] ¡Media vuelta completa! Cambiando productos...');
        renderRandomProducts();
        gearRotation = 0;
        totalRotation = 0;
        const gear = document.getElementById('interactiveGear');
        if (gear) {
            gear.style.transform = 'rotate(0deg)';
            console.log('[DEBUG] Engranaje reseteado');
        }
    } else {
        console.log('[DEBUG] No completó media vuelta, necesita', (160 - Math.abs(totalRotation)).toFixed(2), 'grados más');
    }
}


function setupCarouselClicks() {
    console.log('[DEBUG] Configurando clicks del carousel...');
    
    
    setTimeout(() => {
        const carouselItems = document.querySelectorAll('.carousel-clickable');
        
        console.log('[DEBUG] Items del carousel encontrados:', carouselItems.length);
        
        carouselItems.forEach((item, index) => {
            item.addEventListener('click', async function() {
                const productImage = this.getAttribute('data-product-image');
                console.log(' [DEBUG] Click en carousel item', index, ', buscando por imagen:', productImage);
                
             
                try {
                    const response = await fetch(`http://localhost:3001/api/productos/buscar-imagen/${encodeURIComponent(productImage)}`);
                    
                    if (!response.ok) {
                        throw new Error('Producto no encontrado');
                    }
                    
                    const product = await response.json();
                    console.log(' [DEBUG] Producto encontrado:', product);
                    
                
                    window.location.href = `producto.html?id=${product.id}`;
                    
                } catch (error) {
                    console.error(' [ERROR] Error buscando producto:', error);
                    alert('No se pudo encontrar el producto. Asegúrate de que esté en la base de datos.');
                }
            });
        });
        
        console.log(' [DEBUG] Carousel configurado para clicks');
    }, 500); 
}


console.log(' [DEBUG] Esperando carga del DOM...');

document.addEventListener('DOMContentLoaded', () => {
    console.log('[DEBUG] DOM cargado!');
    
    const gear = document.getElementById('interactiveGear');
    
    if (!gear) {
        console.error(' [ERROR] No se encontró el elemento interactiveGear en el DOM');
        console.log(' [DEBUG] Elementos disponibles con ID:', 
            Array.from(document.querySelectorAll('[id]')).map(el => el.id));
        return;
    }
    
    console.log('[DEBUG] Engranaje encontrado:', gear);
    
    
    gear.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', endDrag);
    console.log(' [DEBUG] Eventos de mouse agregados');
    
    
    gear.addEventListener('touchstart', startDrag, { passive: false });
    document.addEventListener('touchmove', drag, { passive: false });
    document.addEventListener('touchend', endDrag, { passive: false });
    console.log(' [DEBUG] Eventos de touch agregados');
    
 
    setupCarouselClicks();
    
    
    loadSeasonalProducts(); 
    loadProducts();
    startAutoplay(); 
    console.log(' [DEBUG] Inicialización completa!');
});

console.log('[DEBUG] Script cargado completamente');