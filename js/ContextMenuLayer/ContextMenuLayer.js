import { Rect, Text, Group } from 'konva';
import colours from '../colours';

export default class ContextMenuLayer {

    constructor(conversionManager, layerRef) {
        this._conversionManager = conversionManager;
        this.layer = layerRef;
    }

    addContextMenu({ rawX, rawY, menuWidth = 150, menuItems }) {
        this.removeContextMenu();

        const expectedHeight = menuItems.length * 30;
        const hasRoomBelow = this._conversionManager.stageHeight - rawY > expectedHeight;
        const hasRoomToRight = this._conversionManager.stageWidth - rawX > menuWidth;

        const xCoord = hasRoomToRight ? rawX : rawX - menuWidth;
        const yCoord = hasRoomBelow ? rawY : rawY - expectedHeight;

        const contextMenuGroup = new Group({ 
            id: 'CONTEXT_MENU_GROUP',
            x: xCoord,
            y: yCoord
        });

        menuItems.forEach((menuItem, idx) => {
            let cornerRadiusArray;
            if (idx === 0) {
                cornerRadiusArray = [3, 3, 0, 0]
            } else if (idx === menuItems.length - 1) {
                cornerRadiusArray = [0, 0, 3, 3];
            } else {
                cornerRadiusArray = [0, 0, 0, 0];
            }
            const menuItemBackground = new Rect({
                x: 0,
                y: idx * 30,
                width: 150,
                height: 30,
                fill: colours.grayscale[5],
                name: 'MENU_ITEM_BACKGROUND',
                cornerRadius: cornerRadiusArray,
                idx
            });
            const label = new Text({
                text: menuItem.label,
                fill: '#fff',
                x: 10,
                y: (idx * 30) + 10
            });
            menuItemBackground.moveTo(contextMenuGroup);
            label.moveTo(contextMenuGroup);
        });

        contextMenuGroup.on('mousedown', e => {
            e.cancelBubble = true;
            const { offsetY } = e.evt;
            const groupY = contextMenuGroup.y();
            const relativeY = offsetY - groupY;
            const idxClicked = Math.floor(relativeY / 30);
            const itemClicked = menuItems[idxClicked];
            console.log(itemClicked);
            itemClicked.callback();
            contextMenuGroup.destroy();
            this.layer.batchDraw();
        });
        contextMenuGroup.on('mouseover', e => {
            const menuItemBackgrounds = [...contextMenuGroup.find('.MENU_ITEM_BACKGROUND')];
            const relativeY = e.evt.offsetY - contextMenuGroup.y();
            const idx = Math.floor(relativeY / 30);
            const activeMenuItem = menuItemBackgrounds.find(item => item.attrs.idx === idx);
            if (activeMenuItem) {
                activeMenuItem.fill(colours.grayscale[4]);
                this.layer.batchDraw();
            }
        });
        contextMenuGroup.on('mouseout', e => {
            const menuItemBackgrounds = contextMenuGroup.find('.MENU_ITEM_BACKGROUND');
            menuItemBackgrounds.forEach(item => item.fill(colours.grayscale[5]));
            this.layer.batchDraw();
        });

        this.layer.add(contextMenuGroup);
        this.layer.batchDraw();
    }

    removeContextMenu() {
        const contextMenu = this.layer.findOne('#CONTEXT_MENU_GROUP');
        if (contextMenu) {
            contextMenu.destroy();
            this.layer.batchDraw();
        }
    }

}
