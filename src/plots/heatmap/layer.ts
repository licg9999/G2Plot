import { DataPointType } from '@antv/g2/lib/interface';
import * as _ from '@antv/util';
import { registerPlotType } from '../../base/global';
import { LayerConfig } from '../../base/layer';
import ViewLayer, { ViewConfig } from '../../base/view-layer';
import { getComponent } from '../../components/factory';
import { getGeom } from '../../geoms/factory';
import { extractScale } from '../../util/scale';
import '../../geoms/heatmap/linear';
import HeatmapLegend, { HeatmapLegendConfig } from './components/legend';
import HeatmapBackground, { HeatmapBackgroundConfig } from './components/background';
import '../scatter/components/label/scatter-label';

interface PointStyle {
  lineDash?: number[];
  lineWidth?: number;
  opacity?: string;
  fillStyle?: string;
  strokeStyle?: string;
}

export interface HeatmapViewConfig extends ViewConfig {
  colorField: string;
  radius?: number;
  intensity?: number;
  point?: {
    visible?: boolean;
    shape?: string;
    size?: number;
    color?: string;
    style?: PointStyle;
  };
  legend: HeatmapLegendConfig;
  background?: {};
}

export interface HeatmapLayerConfig extends HeatmapViewConfig, LayerConfig {}

export default class HeatmapLayer<T extends HeatmapLayerConfig = HeatmapLayerConfig> extends ViewLayer<T> {
  public type: string = 'heatmap';
  protected heatmapLegend: HeatmapLegend;
  protected background: HeatmapBackground;
  protected count: number = 0;

  public static getDefaultOptions(): any {
    return _.deepMix({}, super.getDefaultOptions(), {
      xAxis: {
        visible: true,
        autoHideLabel: true,
        autoRotateLabel: true,
        autoRotateTitle: false,
        grid: {
          visible: false,
        },
        line: {
          visible: true,
        },
        tickLine: {
          visible: true,
        },
        label: {
          visible: true,
        },
        title: {
          visible: true,
          offset: 12,
        },
      },
      yAxis: {
        visible: true,
        autoHideLabel: true,
        autoRotateLabel: false,
        autoRotateTitle: true,
        grid: {
          visible: false,
        },
        line: {
          visible: true,
        },
        tickLine: {
          visible: true,
        },
        label: {
          visible: true,
        },
        title: {
          visible: true,
          offset: 12,
        },
      },
      tooltip: {
        visible: true,
        crosshairs: {
          type: 'cross',
          style: {
            lineWidth: 2,
          },
        },
      },
      legend: {
        visible: true,
        position: 'bottom-center',
      },
      color: [
        'rgba(33,102,172,0)',
        'rgb(103,169,207)',
        'rgb(209,229,240)',
        'rgb(253,219,199)',
        'rgb(239,138,98)',
        'rgb(178,24,43)',
      ],
    });
  }

  public afterRender() {
    if (this.options.legend && this.options.legend.visible && this.count < 2) {
      this.heatmapLegend && this.heatmapLegend.destroy();
      this.heatmapLegend = new HeatmapLegend({
        view: this.view,
        plot: this,
        ...this.options.legend,
      });
      this.heatmapLegend.render();
      this.paddingController.registerPadding(this.heatmapLegend, 'outer');
    }
    if (this.options.background && this.options.padding !== 'auto') {
      this.background = new HeatmapBackground({
        view: this.view,
        plot: this,
        ...this.options.background,
      });
      this.background.render();
    }
    super.afterRender();
    this.count += 1;
  }

  public destroy() {
    if (this.heatmapLegend) {
      this.heatmapLegend.destroy();
      this.heatmapLegend = null;
    }
    if (this.background) {
      this.background.destroy();
      this.background = null;
    }
    super.destroy();
  }

  protected scale() {
    const props = this.options;
    const scales = {};
    /** 配置x-scale */
    scales[props.xField] = {};
    if (_.has(props, 'xAxis')) {
      extractScale(scales[props.xField], props.xAxis);
    }
    /** 配置y-scale */
    scales[props.yField] = {};
    if (_.has(props, 'yAxis')) {
      extractScale(scales[props.yField], props.yAxis);
    }
    this.setConfig('scales', scales);
    super.scale();
  }

  protected coord() {}

  protected geometryParser(dim, type) {
    return 'heatmap';
  }

  protected addGeometry() {
    const config = {
      type: 'linearHeatmap',
      position: {
        fields: [this.options.xField, this.options.yField],
      },
      color: {
        fields: [this.options.colorField],
        values: this.options.color,
      },
    } as any;

    if (this.options.radius) {
      config.radius = this.options.radius;
    }

    if (this.options.intensity) {
      config.intensity = this.options.intensity;
    }

    this.setConfig('element', config);

    this.addPoint();
  }

  protected addPoint() {
    const props = this.options;
    const defaultConfig = { visible: false, size: 0 };
    if (props.point && props.point.visible) {
      props.point = _.deepMix(defaultConfig, props.point);
    } else {
      props.point = defaultConfig;
    }
    const point = getGeom('point', 'guide', {
      plot: this,
    });
    point.active = false;
    point.label = this.extractLabel();
    this.setConfig('element', point);
  }

  protected extractLabel() {
    const props = this.options;
    const label = props.label;
    if (label && label.visible === false) {
      return false;
    }
    const labelConfig = getComponent('label', {
      plot: this,
      labelType: 'scatterLabel',
      fields: [props.xField, props.yField],
      position: 'middle',
      offset: 0,
      ...label,
    });
    return labelConfig;
  }

  protected legend() {
    this.setConfig('legends', false);
  }

  protected animation() {}
}

registerPlotType('heatmap', HeatmapLayer);
