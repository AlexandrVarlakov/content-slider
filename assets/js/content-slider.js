/**
 * ============Своства=============
 * number baseWidthItem - базовая ширина, от которой идет вычисления
 * node slider - контейнер карусели
 * number maxItemsInScreen - максимальное количество элементов которое может поместиться в области
 * number widht- ширина контейнера в px
 * number showedItems - количество элементов реально отображаемых на экране в зависимости от ширины контейнера и заданаого значения itemsInScreen
 * number itemsWidth - ширина контейнера элемента
 * number itemsQty - общее количество элементов
 * nodeList itemsList - элементов карусели
 * number baseScrollQty - количество элементов, которое будет проскроленно за один раз 
 * number scrollingItems - количество элементов, которое будет проскроленно c учетом показываемого количества элементов 
 * ============Методы==============
 * 
 * ===========Параметры============
 * number baseWidthItem - базовая ширина, от которой идет вычисления
 * number itemsInScreen - количество отображаемых элементов 
 * number scrollingItems - количество элементов, которое будет проскроленно за один раз
 */

class contentSlider extends EventTarget{
    constructor(_slider, options = {}){
        super();
        let self = this;
        //0.Обрабатываем параметры
        this.showNavBtn = (options.navBtn == 'undefined' || typeof(options.navBtn) != 'boolean') ? true :options.navBtn;
        this.showPagination = (options.pagination == 'undefined' || typeof(options.pagination) != 'boolean') ? true :options.pagination;
        this.itemsInScreen = ( options.itemsInScreen == 'undefined' || typeof(options.itemsInScreen) != 'number' ) ? 3 : options.itemsInScreen;
        this.scrollQty = ( options.scrollQty == 'undefined' || typeof(options.scrollQty) != 'number' ) ? 3 : options.scrollQty;
        this.baseWidthItem = ( options.baseWidthItem == 'undefined' || typeof(options.baseWidthItem) != 'number' ) ? 300 : options.baseWidthItem;

        this.autoMove = (options.autoMove == 'undefined' || typeof(options.autoMove) != 'boolean') ? true :options.autoMove;
        this.autoMoveInterval = ( options.autoMoveInterval == 'undefined' || typeof(options.autoMoveInterval) != 'number' ) ? 3 : options.autoMoveInterval;
        this.autoMoveReplay = (options.autoMoveReplay == 'undefined' || typeof(options.autoMoveReplay) != 'boolean') ? false :options.autoMoveReplay;
        this.autoMoveIntervalCount = this.autoMoveInterval;

        this.baseScrollQty = options.scrollQty;
        this.scrollingItems = this.scrollQty;
        this.currentPos = 0;
        this.deltaWheel = 0;
        this.setAutoMove( this.autoMove );
 
        if ( (this.showPagination == false) && (this.showNavBtn == false)) this.showPagination = true;
        
        //1 Подключаемся к Карусели
        this.slider = document.getElementById(_slider);

        

        //2 Получаем список 
        this.itemsList = this.slider.querySelectorAll('.item');
        this.itemsQty = this.itemsList.length;
        
        //3.Создаем структуру  карусели
        this.paginationCreated = false;
        this.createStructure();
        
        this.calculateShownItemsOnLoad();
        this.createNavigationOnLoad();
        
        this.setOnTouchStart();
        this.setOnTouchEnd(); 

        this.createPaginationBtn();
        this.managePagination();
        this.manageNavigationBtn()
        this.setWatchToWheel();
        this.addEventListener('changepagination', ()=>{
            if  ( this.paginationCreated ){
                this.destroyPagination();
                this.createPaginationBtn();
                
            } else{
                this.createPaginationBtn();
            }
        });

        window.addEventListener('resize', ()=>{ 
            this.calculateShownItemsOnResize();
            this.editNavigationOnResize();
            this.manageNavigationBtn();
            this.managePagination();
        });

        
        this.addEventListener('move', ()=>{
            if ( this.paginationCreated){
                let oldPos = this.pagination.querySelector('.slider__button_active');
                oldPos.classList.remove('slider__button_active');

                let newPos = this.pagination.querySelectorAll('.slider__button');
                newPos[this.currentPos].classList.add('slider__button_active');                               
            }
            this.deltaWheel = 0;
            this.autoMoveIntervalCount = this.autoMoveInterval;
                        
            //Производим перемещения
            let transformationStep = (this.scrollingItems / this.showedItems ) * (-100);
    
            if ((this.currentPos == (this.qtyNav-1)) && (this.appendix > 0)) {
                this.slideLine.style.transform = 'translateX('+  (transformationStep*(this.currentPos-1) + this.percentAppendix)  +'%)';
                    
            } else {
                this.slideLine.style.transform = 'translateX('+transformationStep*this.currentPos+'%)';
            }

        });
        

    }
    
   
    createStructure(){
        //1.Создаем контейнер для элементов с кнопками навигации
        this.contentContainer = document.createElement('div');
        this.contentContainer.classList.add('slider__content')
        this.slider.prepend(this.contentContainer);

        //2.Создаем контейнер для элементов
        this.slideLine = document.createElement('div');
        this.slideLine.classList.add('slider__slide-line');
        
        //3. Создаем обертку для контейнера слайдов, которая будет скрывать выезжающие за границу слайды
        this.slideLineWrap = document.createElement('div');
        this.slideLineWrap.classList.add('slider__slide-line-wrap');
        this.slideLineWrap.append(this.slideLine);
        
        this.contentContainer.append(this.slideLineWrap);
        this.slider.prepend(this.contentContainer);
        
        this.itemsList.forEach( (item) =>{
            this.slideLine.append(item);
        })

        this.createPrevBtn();
        this.createNextBtn();
        this.createPagination();
        
        
    }
    createPagination(){
        this.pagination = document.createElement('div');
        this.pagination.classList.add('slider__pagination');
        this.slider.append(this.pagination);
    }

    createPrevBtn(){
        this.prevBtn = document.createElement('div');
        this.prevBtn.classList.add('slider__prev-btn');
        this.prevBtn.innerHTML = '&lsaquo;';        
        this.prevBtnWrap = document.createElement('div');
        this.prevBtnWrap.classList.add('slider__nav-conatiner');
        this.contentContainer.prepend(this.prevBtnWrap);
        this.prevBtnWrap.append(this.prevBtn);

        this.prevBtn.addEventListener('click', ()=>{
            this.prevBtnClick();            
        })
    }

    prevBtnClick(){
        let inx = this.currentPos;
        if ( inx > 0 ){
            inx--;
            this.currentPos = inx;
            let event = new Event('move');
            this.dispatchEvent(event);
        }
    }

    createNextBtn(){
        this.nextBtn = document.createElement('div');
        this.nextBtn.classList.add('slider__next-btn');
        this.nextBtn.innerHTML = '&rsaquo;';
        this.nextBtnWrap = document.createElement('div');
        this.nextBtnWrap.classList.add('slider__nav-conatiner');
        this.contentContainer.append(this.nextBtnWrap);
        this.nextBtnWrap.append(this.nextBtn);

        this.nextBtn.addEventListener('click', ()=>{
            this.nextBtnClick();
        })
    }

    nextBtnClick( ){        
        let inx = this.currentPos;
        
        if ( inx < this.qtyNav - 1 ){
            inx++;
            this.currentPos = inx;
            let event = new Event('move');
            this.dispatchEvent(event);
        }        
    }

    calculateShownItemsOnLoad(){
        //1. Получаем ширину карусели
        this.width = this.slider.offsetWidth;
        //2. Вычисляем сколько максимально можно поместить элементов при данной ширине   
        this.maxItemsInScreen = Math.floor( ( this.width ) / ( this.baseWidthItem ) );
        if ( this.maxItemsInScreen  < 1 ) {
            this.maxItemsInScreen = 1;
        }
        //3. Устанавливаем сколько будет отображаться
        

        if ( ( this.itemsQty <= this.maxItemsInScreen ) && ( this.itemsQty <= this.itemsInScreen)){
            this.showedItems = this.itemsQty;
        } else if( this.maxItemsInScreen <= this.itemsInScreen ){
            this.showedItems = this.maxItemsInScreen;
        } else {
            this.showedItems = this.itemsInScreen;
        }
        
        //Вычисляем ширину каждого
        this.itemsWidth = (100 / this.showedItems).toFixed(2);
        
        //Устанавливаем каждому элементу вычесленную ширину
        this.itemsList.forEach( (item) => {
            item.style.minWidth = this.itemsWidth + '%';
    
        });
        
        
        let a = this.itemsQty - this.showedItems;
        
        if (a > 0) {
                        
            this.appendix = a % this.scrollingItems;
            if ( this.appendix > 0) this.percentAppendix = (this.appendix / this.showedItems) * (-100);
            
        }
        if ( this.baseScrollQty > this.showedItems ){        
            if ( this.scrollingItems != this.showedItems ){
                this.scrollingItems = this.showedItems;
                
            }

        } else {
            if ( this.scrollingItems != this.baseScrollQty ){
                this.scrollingItems = this.baseScrollQty;
                 
                
            }
        }

        
        
    }

    calculateShownItemsOnResize(){
        let tempShowed = this.showedItems;
        this.calculateShownItemsOnLoad();
        if ( (tempShowed != this.showedItems)  && (this.currentPos > 0) ){
            this.slideLine.style.transform = 'translateX(0%)';
            this.currentPos = 0;
            
        }
        if ( (tempShowed != this.showedItems) ){

            let a = this.itemsQty - this.showedItems;            
            this.qtyNav = 0;
            
            if (a > 0) {
                this.qtyNav = Math.ceil( a / this.scrollingItems );                
                this.qtyNav++;
            }

            let chengenav = new Event('changepagination');
            this.dispatchEvent(chengenav);
        }
    }
    
    createNavigationOnLoad(){
        
        if ( (this.itemsQty > this.showedItems)  ){
            let a = this.itemsQty - this.showedItems;
            
            this.qtyNav = 0;
            this.appendix = 0;
            this.percentAppendix = 0;        
            if (a > 0) {
                this.qtyNav = Math.ceil( a / this.scrollingItems );
                this.qtyNav++;
                this.appendix = a % this.scrollingItems;
                if ( this.appendix > 0) this.percentAppendix = (this.appendix / this.showedItems) * (-100);
            }

            

        }   
    }
    editNavigationOnResize(){
        let tempQtyNav = this.qtyNav;
        
        this.createNavigationOnLoad();

        if ( (this.qtyNav != tempQtyNav) && (this.currentPos > 0) ) {
            this.slideLine.style.transform = 'translateX(0%)';
            this.currentPos = 0;
            let navEvent = new Event('navchange');
            this.dispatchEvent(navEvent);
        }
    }
    
    createPaginationBtn(){
        let self = this;
        let tempQtyNav = this.qtyNav;
        if ( (this.itemsQty > this.showedItems ) && ( this.showPagination ) ){
            for (let i = 0;  i < this.qtyNav; i++){
                let btn = document.createElement('div')
                btn.classList.add('slider__button');
                let btnInner = document.createElement('div')
                btnInner.classList.add('slider__button-inner');
                btn.setAttribute('data-index', i);
                btn.append(btnInner);
                
                btn.onclick = function(){  
                    self.currentPos = i;
                    let event = new Event('move');
                    self.dispatchEvent(event);

                }

                this.pagination.append(btn);
            }
            this.paginationCreated = true;            
            this.paginationBtnList = this.pagination.querySelectorAll('.slider__button');            
            if ( this.paginationBtnList.length > 0 )  this.paginationBtnList[0].classList.add('slider__button_active');
        }
    }

    
    managePagination(){
        if ( (this.itemsQty <= this.showedItems ) || (this.showPagination == false)){
            this.pagination.style.display = 'none';
        } else if ( (this.itemsQty > this.showedItems ) && ( this.showPagination ) ){
            this.pagination.style.display = 'flex';
        }
    }

    manageNavigationBtn(){    
        let navBtnContainers = this.slider.querySelectorAll('.slider__nav-conatiner');
        if ( (this.itemsQty <= this.showedItems ) || ( this.showNavBtn == false)){
            navBtnContainers.forEach( (item) => {
                item.style.display = 'none';
            } )
        } else if ( (this.itemsQty > this.showedItems ) && ( this.showNavBtn ) ) {
            navBtnContainers.forEach( (item) => {
                item.style.display = 'flex';
            } )
        } 
    }
         
    
    destroyPagination(){     
        let btnList = this.pagination.querySelectorAll('.slider__button');
        btnList.forEach( (item) => {
            item.remove();
        } );
        this.paginationCreated = false;
    }

    setAutoMove( mode ){
        
        if ( mode ) {
            this.slideMover = setInterval( ()=>{
                
                this.autoMoveIntervalCount--;
                if ( this.autoMoveIntervalCount <= 0 ){
                    let inx = this.currentPos;
                    if ( inx < this.qtyNav - 1 ){
                        inx++;
                        this.currentPos = inx;
                        let event = new Event('move');
                        this.dispatchEvent(event);
                    } else{
                        if (this.autoMoveReplay == true){
                            inx = 0;
                            this.currentPos = inx;
                            let event = new Event('move');
                            this.dispatchEvent(event);
                        }
                            
                    }
                }
            }, 1000);
        }
    }

    setWatchToWheel(){
        if (this.slider.addEventListener) {
            if ('onwheel' in document) {
              
              this.slider.addEventListener("wheel", (event)=>{
                this.onWheel(event)
              });
            } else if ('onmousewheel' in document) {
              
              this.slider.addEventListener("mousewheel", (event)=>{
                this.onWheel(event)
              });
            } else {
              
              this.slider.addEventListener("MozMousePixelScroll", (event)=>{
                this.onWheel(event)
              });
            }
          } else {
            this.slider.attachEvent("onmousewheel", (event)=>{
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
                let inx = this.currentPos;
                if ( inx < this.qtyNav - 1 ){
                    inx++;
                    this.currentPos = inx;
                    let event = new Event('move');
                    this.dispatchEvent(event);
                }
            }
        } else {
            this.deltaWheel--;
   
            if ( this.deltaWheel < -2 ){ 
                let inx = this.currentPos;

                if ( inx > 0 ){
                    inx--;
                    this.currentPos = inx;
                    let event = new Event('move');
                    this.dispatchEvent(event);
                }
            }
        }
        
        event.preventDefault ? event.preventDefault() : (event.returnValue = false);
    }

    setOnTouchStart(){
        this.slider.addEventListener('touchstart', (event)=>{
            
            this.mobile = true;
            this.startTouch = event.changedTouches[0].pageX;
        })
        
    }

    setOnTouchEnd(){
        this.slider.addEventListener('touchend', (event)=>{
            if ( this.mobile ) {
                let delta = ( this.startTouch - event.changedTouches[0].pageX ); 
                
                if ( ( this.startTouch  > event.changedTouches[0].pageX ) &&  (this.startTouch - event.changedTouches[0].pageX > 100) ) {
                    let inx = this.currentPos;
                    if ( inx < this.qtyNav - 1 ){
                        inx++;
                        this.currentPos = inx;
                        let event = new Event('move');
                        this.dispatchEvent(event);
                    }
                }
 
                if ( ( this.startTouch  < event.changedTouches[0].pageX ) &&  ( event.changedTouches[0].pageX - this.startTouch > 100) ) {
                 let inx = this.currentPos;
                 if ( inx > 0 ){
                     inx--;
                     this.currentPos = inx;
                     let event = new Event('move');
                     this.dispatchEvent(event);
                 }
             }
                this.mobile = false;
                this.startTouch = 0;
             }
        });
    }




}
options = {
    
    baseWidthItem: 300,
    itemsInScreen: 2,
    scrollQty: 3,
    pagination: true, 
    navBtn: true,
    autoMove: false,
    autoMoveInterval: 3,
    autoMoveReplay: true
}

let c = new contentSlider('slider', options);
options2 = {
    
    baseWidthItem: 250,
    itemsInScreen: 3,
    scrollQty: 3,
    pagination: true, 
    navBtn: true,
    autoMove: false,
    autoMoveInterval: 3,
    autoMoveReplay: true
}
let b = new contentSlider('slider2', options2);

 