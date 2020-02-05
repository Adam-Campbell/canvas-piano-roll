import Konva from 'konva';
import ConversionManager from '../ConversionManager';
import { Colours, KonvaEvent } from '../../Constants';

interface MenuItem {
    label: string,
    callback: Function
}

interface ContextMenuOptions {
    rawX: number,
    rawY: number,
    menuWidth?: number,
    menuItems: MenuItem[]
}

export default class ContextMenuLayer {

    private conversionManager: ConversionManager;
    private layer: Konva.Layer;

    constructor(conversionManager: ConversionManager, layerRef: Konva.Layer) {
        this.conversionManager = conversionManager;
        this.layer = layerRef;
    }

    addContextMenu({ rawX, rawY, menuWidth = 150, menuItems }: ContextMenuOptions) : void {
        this.removeContextMenu();

        const expectedHeight = menuItems.length * 30;
        const hasRoomBelow = this.conversionManager.stageHeight - rawY > expectedHeight;
        const hasRoomToRight = this.conversionManager.stageWidth - rawX > menuWidth;

        const xCoord = hasRoomToRight ? rawX : rawX - menuWidth;
        const yCoord = hasRoomBelow ? rawY : rawY - expectedHeight;

        const contextMenuGroup = new Konva.Group({ 
            id: 'CONTEXT_MENU_GROUP',
            x: xCoord,
            y: yCoord
        });

        menuItems.forEach((menuItem: MenuItem, idx: number) => {
            let cornerRadiusArray;
            if (idx === 0) {
                cornerRadiusArray = [3, 3, 0, 0]
            } else if (idx === menuItems.length - 1) {
                cornerRadiusArray = [0, 0, 3, 3];
            } else {
                cornerRadiusArray = [0, 0, 0, 0];
            }
            const menuItemBackground = new Konva.Rect({
                x: 0,
                y: idx * 30,
                width: 150,
                height: 30,
                fill: Colours.grayscale[5],
                name: 'MENU_ITEM_BACKGROUND',
                cornerRadius: cornerRadiusArray,
                idx
            });
            const label = new Konva.Text({
                text: menuItem.label,
                fill: '#fff',
                x: 10,
                y: (idx * 30) + 10
            });
            menuItemBackground.moveTo(contextMenuGroup);
            label.moveTo(contextMenuGroup);
        });

        contextMenuGroup.on('mousedown', (e: KonvaEvent) => {
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
        contextMenuGroup.on('mouseover', (e: KonvaEvent) => {
            const menuItemBackgrounds = [...contextMenuGroup.find('.MENU_ITEM_BACKGROUND')];
            const relativeY = e.evt.offsetY - contextMenuGroup.y();
            const idx = Math.floor(relativeY / 30);
            const activeMenuItem = menuItemBackgrounds.find(item => item.attrs.idx === idx);
            if (activeMenuItem) {
                activeMenuItem.fill(Colours.grayscale[4]);
                this.layer.batchDraw();
            }
        });
        contextMenuGroup.on('mouseout', (e: KonvaEvent) => {
            const menuItemBackgrounds = contextMenuGroup.find('.MENU_ITEM_BACKGROUND');
            menuItemBackgrounds.forEach(item => item.fill(Colours.grayscale[5]));
            this.layer.batchDraw();
        });

        this.layer.add(contextMenuGroup);
        this.layer.batchDraw();
    }

    removeContextMenu() : void {
        const contextMenu = this.layer.findOne('#CONTEXT_MENU_GROUP');
        if (contextMenu) {
            contextMenu.destroy();
            this.layer.batchDraw();
        }
    }

}
