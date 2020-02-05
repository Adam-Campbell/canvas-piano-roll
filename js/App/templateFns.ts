import { render, html, nothing } from 'lit-html';
import { repeat } from 'lit-html/directives/repeat';
import Window from '../Window';
import { WindowDisplayModes } from '../Constants';

export const generateMenubarMarkup = (addWindowCb: Function) => html`
    <div class="menubar">
        <button @click=${addWindowCb}>Add Window</button>
    </div>
`;

export const generateTaskbarMarkup = (activeWindows: Window[]) => html`
    <div class="taskbar">
        <ul class="taskbar__list" id="taskbar-list">
            ${repeat(
                activeWindows,
                activeWindow => `${activeWindow.id}-taskbar`,
                activeWindow => html`
                    <li 
                        class="taskbar__item" 
                        data-window-id=${activeWindow.id} 
                        @click=${activeWindow.toggleMinimize}
                    >
                        ${activeWindow.title}
                    </li>
                `
            )}
        </ul>
    </div>
`;

export const generateWindowsMarkup = (activeWindows: Window[]) => html`
    ${repeat(
        activeWindows,
        activeWindow => activeWindow.id,
        (activeWindow, idx) => {
            return activeWindow.displayMode === WindowDisplayModes.minimized ? 
            nothing : 
            activeWindow.generateMarkup();
        }
    )}
`;
