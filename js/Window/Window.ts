import EventEmitter from '../EventEmitter';
import { html } from 'lit-html';
import { styleMap } from 'lit-html/directives/style-map';
import {
    WindowInteractionModes,
    WindowDisplayModes,
    Events,
    WindowOptions,
    WindowChild
} from '../Constants';

export default class Window {

    id: string;
    title: string;

    private eventEmitter: EventEmitter;

    private containerNode: HTMLElement;
    private contentNode: HTMLElement;

    currentWidth: number;
    currentHeight: number;
    currentX: number;
    currentY: number;
    private cachedWidth: number;
    private cachedHeight: number;
    private cachedX: number;
    private cachedY: number;
    displayMode = WindowDisplayModes.normal;
    zIndex: number;

    private cachedClientRect: ClientRect | null;
    private cachedEvt: MouseEvent | null;
    private interactionMode: WindowInteractionModes | null;
    private evtXDelta: number | null;
    private evtYDelta: number | null;
    rafStamp: number;

    private child: any;
    private childContext: any;
    
    constructor({
        id, 
        title, 
        eventEmitter,
        settingsManager, 
        initialZIndex, 
        childClass,
        childContext,
        defaultWidth, 
        defaultHeight
    }: WindowOptions) {
        this.id = id;
        this.title = title;
        this.currentWidth = defaultWidth;
        this.currentHeight = defaultHeight;
        this.currentX = 8;
        this.currentY = 80;
        this.eventEmitter = eventEmitter;
        this.zIndex = initialZIndex;
        this.child = new childClass(this.eventEmitter, settingsManager);
        this.childContext = childContext;
    }

    /**
     * Performs cleanup on the window and emits a closeWindow event to let the app know it
     * has closed.
     */
    private handleClose = (e: MouseEvent) : void => {
        this.cleanup();
        this.eventEmitter.emit(Events.closeWindow, this.id);
    }

    /**
     * Toggles between the minimized and normal window states.
     */
    toggleMinimize = () : void => {
        if (this.displayMode === WindowDisplayModes.minimized) {
            this.displayMode = WindowDisplayModes.normal;
            this.eventEmitter.emit(Events.focusWindow, this.id);
            this.init();
        } else {
            this.displayMode = WindowDisplayModes.minimized;
            this.cleanup();
            this.eventEmitter.emit(Events.renderApp);
        }
    }

    /**
     * Toggles between the maximized and regular window states.
     */
    private toggleMaximize = () : void => {
        if (this.displayMode === WindowDisplayModes.maximized) {
            this.restoreWindow();
        } else {
            this.maximizeWindow();
        }
    }

    /**
     * Caches the windows current size and position and then maximizes it. 
     */
    private maximizeWindow = () : void => {
        this.displayMode = WindowDisplayModes.maximized;
        this.cachedWidth = this.currentWidth;
        this.cachedHeight = this.currentHeight;
        this.cachedX = this.currentX;
        this.cachedY = this.currentY;
        const { clientWidth, clientHeight } = document.documentElement;
        this.currentX = 0;
        this.currentY = 0;
        this.currentWidth = clientWidth;
        this.currentHeight = clientHeight;
        this.eventEmitter.emit(Events.renderApp);
        const { innerWidth, innerHeight } = this.getInnerDimensions();
        this.child.handleResize(innerWidth, innerHeight);
    }

    /**
     * Restores the window to its previously cached size and position.
     */
    private restoreWindow = () : void => {
        this.displayMode = WindowDisplayModes.normal;
        this.currentWidth = this.cachedWidth;
        this.currentHeight = this.cachedHeight;
        this.currentX = this.cachedX;
        this.currentY = this.cachedY;
        this.cachedWidth = null;
        this.cachedHeight = null;
        this.cachedX = null;
        this.cachedY = null;
        this.eventEmitter.emit(Events.renderApp);
        const { innerWidth, innerHeight } = this.getInnerDimensions();
        this.child.handleResize(innerWidth, innerHeight);
    }

    /**
     * Enters the reposition interaction mode, caches the event object and the outer containers
     * clientRect at the time of the event.
     */
    private handleTopBarInteraction = (e: MouseEvent) : void => {
        this.eventEmitter.emit(Events.focusWindow, this.id);
        const isTopBarClick = e.target.classList.contains('window__top-bar');
        if (isTopBarClick) {
            this.cachedClientRect = this.containerNode.getBoundingClientRect();
            this.cachedEvt = e;
            this.interactionMode = WindowInteractionModes.reposition;
        }
    }

    /**
     * Enters the resize  interaction mode, caches the event object and the outer containers 
     * clientRect at the time of the event.
     */
    private handleResizeContainerInteraction = (e: MouseEvent) : void => {
        e.preventDefault();
        this.cachedClientRect = this.containerNode.getBoundingClientRect();
        this.cachedEvt = e;
        this.interactionMode = WindowInteractionModes.resize;
    }

    private handleInteractionUpdate = (e: MouseEvent) : void => {
        switch (this.interactionMode) {
            case WindowInteractionModes.reposition:
                this.handleRepositionInteractionUpdate(e);
                break;
            case WindowInteractionModes.resize:
                this.handleResizeInteractionUpdate(e);
                break;
        }
    }

    private updateEvtDeltas = (clientX: number, clientY: number) : void => {
        this.evtXDelta = clientX - this.cachedEvt.clientX;
        this.evtYDelta = clientY - this.cachedEvt.clientY;
    }

    private handleRepositionInteractionUpdate = (e: MouseEvent) : void => {
        e.preventDefault();
        this.updateEvtDeltas(e.clientX, e.clientY);
        if (this.rafStamp) window.cancelAnimationFrame(this.rafStamp);
        this.rafStamp = window.requestAnimationFrame(this.updatePosition);
    }

    private updatePosition = () : void => {
        if (!this.interactionMode) return;
        const newX = this.cachedClientRect.left + this.evtXDelta;
        const newY = this.cachedClientRect.top + this.evtYDelta;
        this.currentX = newX;
        this.currentY = newY;
        this.containerNode.style.left = `${newX}px`;
        this.containerNode.style.top = `${newY}px`;
    }

    private handleResizeInteractionUpdate = (e: MouseEvent) : void => {
        e.preventDefault();
        this.updateEvtDeltas(e.clientX, e.clientY);
        if (this.rafStamp) window.cancelAnimationFrame(this.rafStamp);
        this.rafStamp = window.requestAnimationFrame(this.updateSize);
    }

    /**
     * Updates size of the window, and calls the handleResize method on the windows child class
     * to ensure that it resizes to match the window.
     */
    private updateSize = () : void => {
        if (!this.interactionMode) return;
        const newWidth = Math.max(this.cachedClientRect.width + this.evtXDelta, 250);
        const newHeight = Math.max(this.cachedClientRect.height + this.evtYDelta, 200);
        this.currentWidth = newWidth;
        this.currentHeight = newHeight;
        this.containerNode.style.width = `${newWidth}px`;
        this.containerNode.style.height = `${newHeight}px`;
        const { innerWidth, innerHeight } = this.getInnerDimensions();
        this.child.handleResize(innerWidth, innerHeight);
    }

    /**
     * Returns the current width and height of the inner container that holds this windows
     * contents.
     */
    getInnerDimensions = () : { 
        innerWidth: number, 
        innerHeight: number 
    } => {
        const { width, height } = this.contentNode.getBoundingClientRect();
        return { 
            innerWidth: width, 
            innerHeight: height 
        };
    }

    private handleInteractionEnd = (e: MouseEvent) : void => {
        e.preventDefault();
        this.cachedClientRect = null;
        this.cachedEvt = null;
        this.interactionMode = null;
    }

    /**
     * Returns a lit-html TemplateResult to be used when rendering the view.
     */
    generateMarkup = () => {
        return html`
            <div 
                class="window" 
                id=${this.id}
                style=${styleMap({
                    width: `${this.currentWidth}px`,
                    height: `${this.currentHeight}px`,
                    top: `${this.currentY}px`,
                    left: `${this.currentX}px`,
                    zIndex: `${this.zIndex}`
                })}
            >
                <div class="window__top-bar" @mousedown=${this.handleTopBarInteraction}>
                    <div class="window__actions-container">
                        <button 
                            class="window__action-button window__action-button--close"
                            @click=${this.handleClose}
                        ></button>
                        <button 
                            class="window__action-button window__action-button--minimize"
                            @click=${this.toggleMinimize}
                        ></button>
                        <button 
                            class="window__action-button window__action-button--maximize"
                            @click=${this.toggleMaximize}
                        ></button>
                    </div>
                    <p class="window__title">${this.title}</p>
                </div>
                <div class="window__content-container" tabindex="0"></div>
                <div class="window__bottom-bar">
                    <div class="window__resize-bar-container" @mousedown=${this.handleResizeContainerInteraction}>
                        <span class="window__resize-bar window__resize-bar--1"></span>
                        <span class="window__resize-bar window__resize-bar--2"></span>
                        <span class="window__resize-bar window__resize-bar--3"></span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Caches references to specific DOM nodes that will need to be referenced and then intializes
     * the child class.
     */
    init = () : void => {
        this.containerNode = document.getElementById(this.id);
        this.contentNode = this.containerNode.querySelector('.window__content-container');
        document.body.addEventListener('mousemove', this.handleInteractionUpdate);
        document.body.addEventListener('mouseup', this.handleInteractionEnd);
        const { innerWidth, innerHeight } = this.getInnerDimensions();
        this.child.init({
            container: this.contentNode,
            initialWidth: innerWidth,
            initialHeight: innerHeight,
            ...this.childContext
        });
    }

    /**
     * Performs cleanup on the window and its child class.
     */
    cleanup = () : void => {
        this.containerNode = null;
        this.contentNode = null;
        document.body.removeEventListener('mousemove', this.handleInteractionUpdate);
        document.body.removeEventListener('mouseup', this.handleInteractionEnd);
        this.child.cleanup();
    }

}