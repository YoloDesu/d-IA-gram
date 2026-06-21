import { Component } from '@angular/core';
import { Editor } from './features/editor/editor';

@Component({
  selector: 'app-root',
  imports: [Editor],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {}
