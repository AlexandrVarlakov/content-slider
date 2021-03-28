
/**                                         ==========Свойства==========
 * 
 * boolean      sleepMode - true/false  - включает / выключает "спящий режим", в "спящем режиме" скрываются элементы управления слайдера
 * int          sleepInterval - 0.. интервал в секундах, до перехода в "спящий режим"
 * int          sleepCount - счетчик считающий количество сек. до спящего режима
 * boolenen     sleeping - состояние: "спит" или нет
 * boolean      autoMove - true / false включает / выключает режим автопермещения слайдов     
 * int          moveInterval - 0.. интервал в секундах, до инициализации автоперемещения слайдов
 * int          moveCount - счетчик считающий количество сек. до перемещения слайда
 * int          deltaWheel - счетчик считающий колиство прокруток колисиком мышы
 * string       navButtons - вид кнопки навигации, 'line' поумолчанию
 * Node         carousel - текущий сладер
 * NodeList     imgList - список картинок карусели
 * Node         slideLine - контейнер для картинок
 * Node         navigation -контейнер для кнопок навигации   
 * NodeList     navList - список кнопок навигации
 * int          currentSlide - индекс текущего слайда 
 * boolean      mobile - отображает открыт ли сайт через моб. устройство
 * int          startTouch - начало координат перемещения пальцем по экрану
 * int          endTouch - конец координат перемещения пальцем по экрану
 
        
        
 *                                          ==========Методы==========
 * 
 * watchSleep( mode ) - запускает interval отсчитывающий секунды до "сна". Генерирует событие sleep, параметр mode: true/false принимает this.sleepMode
 * onsleep - метод реагирущий на событие sleep 
 * wakeUp( mode ) - метод "Будит" карусель, обнуляет счетчик, показывает элементы управления, параметр mode: true/false принимает this.sleepMode
 * setAutoMove( mode ) - запускает счетчик автоперемещение слайдов, параметр mode: true/false принимает this.autoMove
 * createTitle(wrap, item) - проверяет если в item data-* title, subtitle, link данные, если есть создает соответствующий узел и вставлет его в wrap
 * createPrevBtn(), createNextBtn() - создаются кнопки навигации вперед, назад
 * createNavItem (this.navigation, index) - создает кнопки навигации
 *  setOnTouchStart() - устанавливает обработчик на начало движения по тачскрину
 *  setOnTouchEnd() - устанавливает обработчик на конец движения по тачскрину
 *  setWathcToWheel() - устанавливает обработчик на событие прокрутки колесика мыши
 *  onWheel(event) - обработчик прокрутки колесика мыши
 *  onSlideMove - обработчик события перемещения слайда
*/

/**                                         ==========Options Параметры==========
 * 
 * boolean      sleepMode - true/false  - включает / выключает "спящий режим", в "спящем режиме" скрываются элементы управления слайдера
 * int          sleepInterval - 0.. интервал в секундах, до перехода в "спящий режим"
 * boolean      autoMove - true/false - включает / выключает режим автоперемещения слайдов
 * int          moveInterval - 0.. - интервал через который будет производится автоперемещение
 * string       navButtons ['line', 'square', 'round'] - стиль отображения кнопок навигации default = 'line'
 */


class carousel_FS extends EventTarget{
    constructor(_carousel, options = {
                                sleepMode: true, 
                                sleepInterval: 3,
                                autoMove: true,
                                moveInterval: 3,
                                navButtons: 'line' }){
        super();       
        
        //Для меняющегося контекста
        let self = this;
        this.deltaWheel = 0;
        switch ( options.navButtons ){
            case 'round': this.navButtons = 'round'; break;
            case 'square': this.navButtons = 'square'; break;
            dafault: this.navButtons = 'line'; 
        }

        //Инициализируем "Спящий режим"
        this.sleepMode = ( typeof(options.sleepMode) == 'undefined' || typeof(options.sleepMode) != 'boolean') ? true:options.sleepMode;
        this.sleepInterval = ( (typeof(options.sleepInterval) == 'undefined') || (options.sleepInterval < 1) || (typeof(options.sleepInterval) != 'number' ) ) ? 3 : options.sleepInterval;
        this.sleepCount = this.sleepInterval; 
        this.sleeping = false;                                                    
        this.watchSleep( this.sleepMode );        
        
        //Инициализируем автоперемещения слайдов

        this.autoMove = ( typeof(options.autoMove) == 'undefined' || typeof(options.autoMove ) != 'boolean') ? true:options.autoMove;
        this.moveInterval = ( (typeof(options.moveInterval) == 'undefined') || (options.moveInterval < 1) || (typeof(options.moveInterval) != 'number' ) ) ? 3 : options.moveInterval;
        this.moveCount = this.moveInterval;
        this.setAutoMove( this.autoMove );    
        
        this.carousel = document.getElementById(_carousel);
        this.imgList = this.carousel.querySelectorAll('img');
        
        this.slideLine = document.createElement('div');
        this.slideLine.classList.add('carouselFS__slide-line');     

        this.navigation = document.createElement('div');
        this.navigation.classList.add('carouselFS__navigation');

        this.imgList.forEach( (item, index) => {
           let wrap = document.createElement('div');
           wrap.classList.add('carouselFS__img-wrapper');
           this.carousel.append(wrap);
           wrap.append(item);      
           //Проверяем есть ли атрибуты для вставки текста, если есть то добавляем 
           this.createTitle(wrap, item) ;
           this.slideLine.append(wrap);
           this.createNavItem( this.navigation, index );
        } ); 

        this.carousel.append(this.slideLine);
        this.carousel.append(this.navigation);

        this.createPrevBtn();
        this.createNextBtn();

        this.navList = this.carousel.querySelectorAll('.carouselFS__item');
        this.navList[0].classList.add('carouselFS__item_active');
        
        this.currentSlide = 0;

        this.navList.forEach( ( item, index ) => {
            item.onclick = function(){
                self.currentSlide = index;
                let event = new Event('onmove');
                self.dispatchEvent(event);
            }
        });

        this.prevBtn.addEventListener('click', ()=> { this.prevBtnClick(this) });
        this.nextBtn.addEventListener('click', ()=> { this.nextBtnClick(this) });       

        this.mobile  = false;
        this.startTouch = 0;
        this.setOnTouchStart();
        this.setOnTouchEnd();        

        this.addEventListener('onmove', () =>{ this.onSlideMove( this ); })

        //Слушаем движение мыши над каруселью
        this.carousel.onmousemove = function(){
            self.wakeUp( self.sleepMode );
            
        }  
        //Добавляем реакцию на "засыпание"
        this.addEventListener('sleep', function(){
            this.onsleep();
        });

        this.setWatchToWheel();
        
    }

    

    watchSleep( mode ){
        if ( mode ) {
            this.sleep = setInterval(()=>{
                this.sleepCount--;
                if ( (this.sleeping == false) && (this.sleepCount < 0) ){
                    
                    let event = new Event('sleep');
                    this.dispatchEvent(event);
                }
            }, 1000);
        }
        
    }

    onsleep(){
        this.prevBtn.classList.add('carouselFS__sleep');
        this.nextBtn.classList.add('carouselFS__sleep');
        this.navigation.classList.add('carouselFS__sleep');
        this.sleeping = true;
    }

    wakeUp( mode ){
        if ( mode ){
            if ( ( this.sleeping == true ) && ( this.sleepCount < 0 ) ){
                this.prevBtn.classList.remove('carouselFS__sleep');
                this.nextBtn.classList.remove('carouselFS__sleep');
                this.navigation.classList.remove('carouselFS__sleep');
                this.sleepCount = this.sleepInterval;
                this.sleeping = false;
            }
        }
        
    }

    setAutoMove( mode ){
        if ( mode ) {
            this.slideMover = setInterval( ()=>{
                this.moveCount--;
                if ( this.moveCount <= 0 ){
                    let inx = this.currentSlide;
                    if ( inx < this.navList.length - 1 ){
                        inx++;
                        this.currentSlide = inx;
                        let event = new Event('onmove');
                        this.dispatchEvent(event);
                    } else{
                        inx = 0;
                        this.currentSlide = inx;
                        let event = new Event('onmove');
                        this.dispatchEvent(event);
                    }
                }
            }, 1000);
        }
    }

    createTitle(wrap, item){
        if ( item.hasAttribute('data-title') || item.hasAttribute('data-subtitle') || item.hasAttribute('data-linktext') ) {
            let titleBox = document.createElement('div');
            titleBox.classList.add('carouselFS__title-box');
            wrap.append(titleBox);

            if ( item.hasAttribute('data-title') ){
                 let title = document.createElement('h1');
                 title.innerHTML = item.getAttribute('data-title');
                 title.classList.add('carouselFS__title');

                 if ( item.hasAttribute('data-skin') ) {
                    let skinClass = item.getAttribute('data-skin') + '__title';
                    title.classList.add(skinClass);
                 }
                 titleBox.append(title);
             }

             if ( item.hasAttribute('data-subtitle') ){
                let subtitle = document.createElement('h2');
                subtitle.innerHTML = item.getAttribute('data-subtitle');
                subtitle.classList.add('carouselFS__sub-title');
                if ( item.hasAttribute('data-skin') ) {
                    let skinClass = item.getAttribute('data-skin') + '__sub-title';
                    subtitle.classList.add(skinClass);
                }
                 titleBox.append(subtitle);
             }

             if ( item.hasAttribute('data-linktext') && item.hasAttribute('data-link') ) {
                let linkBox = document.createElement('div');
                let link = document.createElement('a');

                link.classList.add('carouselFS__link');
                if ( item.hasAttribute('data-skin') ) {
                    let skinClass = item.getAttribute('data-skin') + '__link';
                    link.classList.add(skinClass);
                }
                link.innerHTML = item.getAttribute('data-linktext');
                link.setAttribute('href',  item.getAttribute('data-link') );
                linkBox.append(link);
                titleBox.append(linkBox);
                 
             }

        }
    }

    createPrevBtn(){
        this.prevBtn = document.createElement('div');
        this.prevBtn.classList.add('carouselFS__prev-btn');
        this.prevBtn.classList.add('carouselFS__disabled');
        this.prevBtn.innerHTML = '&lsaquo;';
        this.carousel.append(this.prevBtn);
    }

    prevBtnClick( self ){
        let inx = self.currentSlide;
        if ( inx > 0 ){
            inx--;
            self.currentSlide = inx;
            let event = new Event('onmove');
            self.dispatchEvent(event);
        }
    }

    createNextBtn(){
        this.nextBtn = document.createElement('div');
        this.nextBtn.classList.add('carouselFS__next-btn');
        this.nextBtn.innerHTML = '&rsaquo;';
        this.carousel.append(this.nextBtn);
    }

    nextBtnClick( self ){
        let inx = self.currentSlide;
        if ( inx < self.navList.length - 1 ){
            inx++;
            self.currentSlide = inx;
            let event = new Event('onmove');
            self.dispatchEvent(event);
        }
    }

    createNavItem( navblock, index){
        let navItem = document.createElement('div');   
        navItem.classList.add('carouselFS__item');
        let navItemInner = document.createElement('div');
        switch (this.navButtons){
            case 'round': 
                navItemInner.classList.add('carouselFS__round-inner');
                navItem.append(navItemInner);
                navItem.classList.add('carouselFS__round');
                break;

            case 'square': 
                navItemInner.classList.add('carouselFS__square-inner');
                navItem.append(navItemInner);
                navItem.classList.add('carouselFS__square');
                break;
            default: navItem.classList.add('carouselFS__line');
        }         
        
        navItem.setAttribute('data-index', index);
        navblock.append(navItem);
    }

    setOnTouchStart(){
        this.carousel.addEventListener('touchstart', (event)=>{
            this.mobile = true;
            this.startTouch = event.changedTouches[0].pageX;
        })
        
    }

    setOnTouchEnd(){
        this.carousel.addEventListener('touchend', (event)=>{
            if ( this.mobile ) {
                let delta = ( this.startTouch - event.changedTouches[0].pageX ); 

                if ( ( this.startTouch  > event.changedTouches[0].pageX ) &&  (this.startTouch - event.changedTouches[0].pageX > 100) ) {
                    let inx = this.currentSlide;
                    if ( inx < this.navList.length - 1 ){
                        inx++;
                        this.currentSlide = inx;
                        let event = new Event('onmove');
                        this.dispatchEvent(event);
                    }
                }
 
                if ( ( this.startTouch  < event.changedTouches[0].pageX ) &&  ( event.changedTouches[0].pageX - this.startTouch > 100) ) {
                 let inx = this.currentSlide;
                 if ( inx > 0 ){
                     inx--;
                     this.currentSlide = inx;
                     let event = new Event('onmove');
                     this.dispatchEvent(event);
                 }
             }
                this.mobile = false;
                this.startTouch = 0;
             }
        });
    }

    onSlideMove( self ){

        let activeBtn = self.carousel.querySelector('.carouselFS__item_active');
        activeBtn.classList.remove('carouselFS__item_active');
        self.navList[self.currentSlide].classList.add('carouselFS__item_active');
                
        self.slideLine.style.transform = "translateX("+ ( self.currentSlide * 100 * (-1) ) + "%)";
        
        if ( self.currentSlide  > 0 ) {
            this.prevBtn.classList.remove('carouselFS__disabled');
        } else if ( self.currentSlide == 0 ) {
            this.prevBtn.classList.add('carouselFS__disabled');
        }
        
        if ( self.currentSlide == self.imgList.length-1 ){
            this.nextBtn.classList.add('carouselFS__disabled');
        } else {
            this.nextBtn.classList.remove('carouselFS__disabled');
        }

        self.moveCount = self.moveInterval;
        self.deltaWheel = 0;
    }

    setWatchToWheel(){
        if (this.carousel.addEventListener) {
            if ('onwheel' in document) {
              
              this.carousel.addEventListener("wheel", (event)=>{
                this.onWheel(event)
              });
            } else if ('onmousewheel' in document) {
              
              this.carousel.addEventListener("mousewheel", (event)=>{
                this.onWheel(event)
              });
            } else {
              
              this.carousel.addEventListener("MozMousePixelScroll", (event)=>{
                this.onWheel(event)
              });
            }
          } else {
            this.carousel.attachEvent("onmousewheel", (event)=>{
                this.onWheel(event)
            });
          }
        
    }

    onWheel(event) {
        event = event || window.event;

        let delta = event.deltaY || event.detail || event.wheelDelta;

        if ( (delta > 0) && ( this.deltaWheel < 0 ) ) this.deltaWheel = 0;
        if ( (delta < 0) && ( this.deltaWheel > 0 ) ) this.deltaWheel = 0;

        if ( delta  > 0){
            this.deltaWheel++;  
            if ( this.deltaWheel > 2 ){ 
                let inx = this.currentSlide;
                if ( inx < this.navList.length - 1 ){
                    inx++;
                    this.currentSlide = inx;
                    let event = new Event('onmove');
                    this.dispatchEvent(event);
                }
            }
        } else {
            this.deltaWheel--;
   
            if ( this.deltaWheel < -2 ){ 
                let inx = this.currentSlide;

                if ( inx > 0 ){
                    inx--;
                    this.currentSlide = inx;
                    let event = new Event('onmove');
                    this.dispatchEvent(event);
                }
            }
        }
        
        event.preventDefault ? event.preventDefault() : (event.returnValue = false);
    }
}

let options = {
    sleepMode: true,
    sleepInterval: 3, 
    autoMove: true,
    moveInterval: 7,
    navButtons: 'line'
    
}

let c = new carousel_FS('carousel', options);


  