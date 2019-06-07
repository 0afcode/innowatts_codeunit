import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {MatTableDataSource} from '@angular/material/table';
import {HttpClient} from '@angular/common/http';
import {MatPaginator, MatSort} from '@angular/material';
import {environment} from '../../environments/environment';
import * as Highcharts from 'highcharts';
import HC_exporting from 'highcharts/modules/exporting';
import StockModule from 'highcharts/modules/stock';
HC_exporting(Highcharts);
StockModule(Highcharts);

const API_URL = environment.apiUrl;

@Component({
  selector: 'app-chart',
  templateUrl: './app-chart.component.html',
  styleUrls: ['./app-chart.component.css']
})

export class AppChartComponent implements AfterViewInit, OnInit {
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  displayedColumns = ['meterId'];
  dataSource = new MatTableDataSource();
  resultsLength = 0;
  isLoadingRes = false;
  meterSelected = false;

  Highcharts: typeof Highcharts = Highcharts; // required
  chartConstructor = 'stockChart'; // optional string, defaults to 'chart'

  updateFlag = false; // optional boolean
  oneToOneFlag = true; // optional boolean, defaults to false
  runOutsideAngular = false; // optional boolean, defaults to false

  chartType = 'Area';
  chartTypeOptions = [
    "Area", "Bar", "Line"
  ];

  chartOptions: Highcharts.Options = {
    chart: {
      zoomType: 'x'
    },
    rangeSelector: {
      allButtonsEnabled: true,
      selected: 3,
      buttons: [{
        type: 'month',
        count: 1,
        text: '1m'
      }, {
        type: 'day',
        count: 5,
        text: '5d'
      }, {
        type: 'day',
        count: 1,
        text: '1d'
      }, {
        type: 'all',
        text: 'All'
      }]
    },
    title: {
      text: 'Meter Readings Over Time'
    },
    subtitle: {
      text: document.ontouchstart === undefined ?
        'Click and drag in the plot area to zoom in' : 'Pinch the chart to zoom in'
    },
    plotOptions: {
      series: {
        showInNavigator: true,
        stacking: 'normal'
      }
    },
    navigator: {
      enabled: true
    },
    xAxis: {
      type: 'datetime',
      alignTicks: true
    },
    colors: ['#003746', '#d514ff', '#00af33'],
    legend: {
      enabled: true,
      reversed: true
    }
  };

  constructor(private http: HttpClient) {
  }

  chartCallback: Highcharts.ChartCallbackFunction = (chart) => {}; // optional function, defaults to null

  ngOnInit() {
    this.isLoadingRes = true;
    this.dataSource.paginator = this.paginator;
  }

  ngAfterViewInit() {
    this.getData()
      .subscribe(data => {
        this.isLoadingRes = false;
        this.dataSource.data = data;
      });
  }

  getData() {
    return this.http.get<Array<string>>(API_URL + '/api/datatable');
  }

  changeChartType(value) {
    if (value && this.meterSelected) {
      const v = value.toLowerCase();
      this.chartOptions.series.forEach(s => {
        s.type = v;
      });
      this.updateFlag = true;
    }
  }

  requestByMeter(meterId: string) {
    if (!this.meterSelected) {
      this.isLoadingRes = true;
    }
    // console.log('meter: ' + meterId);
    // console.log(environment.apiUrl + '/api/datatable/' + meterId);
    this.http.get<any>(environment.apiUrl + '/api/datatable/' + meterId)
      .subscribe(res => {

        const seriesKeys = Object.keys(res);
        const series = [];

        seriesKeys.forEach((key, ) => {
          series.push({
            name: key,
            type: 'area',
            data: res[key]
          });
        });

        this.chartOptions.series = series;
        this.chartOptions.title.text = 'Meter Readings Over Time for ' + meterId;
        this.updateFlag = true;
        this.meterSelected = true;
        this.isLoadingRes = false;
      });

  }
}
