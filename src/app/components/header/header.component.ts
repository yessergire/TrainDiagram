import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html'
})
export class HeaderComponent implements OnInit {

  title: string = 'Train tracker';
  constructor() { }

  ngOnInit(): void {
  }


  toggleAddTask() {
    console.log("toggle");
  }
}
