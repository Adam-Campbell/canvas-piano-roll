import Konva from 'konva';
import GridLayer from './GridLayer';
import ConversionManager from './ConversionManager';


export default class Arranger {

    private stage: Konva.Stage;
    private conversionManager: ConversionManager;
    primaryBackingLayer: Konva.Layer;
    gridLayer: GridLayer;

    constructor() {
        
    }

    init() {
        this.instantiateChildClasses();
        this.stage.add(this.primaryBackingLayer);
        this.gridLayer.init();
    }

    instantiateChildClasses() : void {
        this.stage = new Konva.Stage({
            container: 'arranger-container',
            width: 750,
            height: 600
        });
        this.conversionManager = new ConversionManager({
            stageWidth: 750,
            stageHeight: 600,
            barWidth: 40,
            barHeight: 40,
            numBars: 16,
            numChannels: 4
        });
        this.primaryBackingLayer = new Konva.Layer();
        this.gridLayer = new GridLayer(this.conversionManager, this.primaryBackingLayer);

    }
    
}
