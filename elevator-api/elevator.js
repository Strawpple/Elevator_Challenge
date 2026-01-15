export default class Elevator {
  constructor() {
    this.currentFloor = 0
    this.stops = 0
    this.floorsTraversed = 0
    this.requests = []
    this.riders= []
  }

  dispatch(){
    this.requests.forEach(request => {
      if(this.riders.length || this.requests.length){
        this.goToFloor(request)
      }
    })
  }

  goToFloor(person){  
    //pickup person
    while(this.currentFloor !== person.currentFloor){
      if(person.currentFloor > this.currentFloor){
        this.moveUp()
      }
      else{
        this.moveDown()
      }
    }

    //drop off people
    this.riders.forEach(rider => {
      while(this.currentFloor !== rider.dropOffFloor && this.riders.length > 0){
        if(rider.dropOffFloor > this.currentFloor){
          this.moveUp()
        }
        else{
          this.moveDown()
        }
      }
    })

    //check if the elevator should return to the loby
    this.checkReturnToLoby() && this.returnToLoby()
  }

  moveUp(){
    this.currentFloor++
    this.floorsTraversed++
    if(this.hasStop()){
      this.stops++
    }    
  }

  moveDown(){
    if(this.currentFloor > 0){      
      this.currentFloor--
      this.floorsTraversed++
      if(this.hasStop()){
        this.stops++
      }
    }
  }

  hasStop(){
    return (this.hasPickup() || this.hasDropoff()) && (this.floorsTraversed > 0) 
  }

  hasPickup(){
    const pickups = this.requests.filter(request => request.currentFloor === this.currentFloor)
    const hasPickup = pickups.length ? true : false

    this.requests = this.requests.filter(request => request.currentFloor !== this.currentFloor)
    pickups.forEach(pickup => this.riders.push(pickup))

    return hasPickup
  }

  hasDropoff(){
    const dropOffs = this.riders.filter(rider => rider.dropOffFloor === this.currentFloor)
    const hasDropoff = dropOffs.length ? true : false

    this.riders = this.riders.filter(rider => rider.dropOffFloor !== this.currentFloor)

    return hasDropoff
  }

  checkReturnToLoby(){
    if(new Date().getHours() < 12 && !this.riders.length){  
      return true
    }

    return false
  }

  returnToLoby(){
    while(this.currentFloor > 0){
      this.moveDown()
    }
  }

  reset(){
    this.currentFloor = 0
    this.stops = 0
    this.floorsTraversed = 0
    this.riders = []
  }
}
