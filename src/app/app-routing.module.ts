import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {AppChartComponent} from './app-chart/app-chart.component';

const routes: Routes = [
  {
    path: '',
    component: AppChartComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
