<script>
	import { mdiAccountOutline } from '@mdi/js';
	import { onMount } from 'svelte';
	import { Avatar, Badge, Divider, Icon } from 'svelte-materialify'
  import { breadCrumbsItems, loadingScreen, notifs } from '$lib/stores/global.store';
  import bcryptjs from 'bcryptjs';
	import { goto } from '$app/navigation';
	import helpers from '$lib/configs/helpers';

  /** @type {import('./$types').PageServerData}*/
  export let data

  let hoveringName = ''

  /**
   * @param {string} isoDate
   * @return {string} Date
   */
  const getDate = (isoDate) => {
		let dueDate = ''

		const [dateValue, timeValue] = isoDate.split('T');
		const [year, month, date] = dateValue.split('-');
		const [hour, minute, other] = timeValue.split(':');

		switch (month) {
			case '01':
				dueDate += 'Jan';
				break;
			case '02':
				dueDate += 'Feb';
				break;
			case '03':
				dueDate += 'Mar';
				break;
			case '04':
				dueDate += 'Apr';
				break;
			case '05':
				dueDate += 'May';
				break;
			case '06':
				dueDate += 'Jun';
				break;
			case '07':
				dueDate += 'Jul';
				break;
			case '08':
				dueDate += 'Aug';
				break;
			case '09':
				dueDate += 'Sep';
				break;
			case '10':
				dueDate += 'Oct';
				break;
			case '11':
				dueDate += 'Nov';
				break;
			case '12':
				dueDate += 'Dec';
				break;
		}

		let finalHour = parseInt(hour);
		switch (finalHour) {
			case 13:
				finalHour = 1;
				break;
			case 14:
				finalHour = 2;
				break;
			case 15:
				finalHour = 3;
				break;
			case 16:
				finalHour = 4;
				break;
			case 17:
				finalHour = 5;
				break;
			case 18:
				finalHour = 6;
				break;
			case 19:
				finalHour = 7;
				break;
			case 20:
				finalHour = 8;
				break;
			case 21:
				finalHour = 9;
				break;
			case 22:
				finalHour = 10;
				break;
			case 23:
				finalHour = 11;
				break;
			case 24:
				finalHour = 0;
				break;
			case 0:
				finalHour = 0;
				break;
			default:
				finalHour = finalHour;
		}

		return `${dueDate} ${date} ${finalHour}:${minute} ${parseInt(hour) > 11 ? 'PM' : 'AM'}`;
	}

  onMount(() => {
    if(!bcryptjs.compareSync(localStorage.getItem('xxx'), data.cUser.password)) {
      $notifs = [
        ...$notifs,
        {
          msg: 'Unauthorized accessing',
          type: 'warn',
          id: (Math.random() * 99) + 1
        }
      ]
      goto('/Signin', {replaceState: true})
      return
    }
    $breadCrumbsItems = [{text: 'Process logs', href: '#'}]
    loadingScreen.set(false)
    helpers.resetPanels()
  })
</script>

<div>
  {#each data.logs as log, i}
    <div class='notification is-relative fredoka-reg mb-1 p-2 has-background-grey-{i % 2 == 0 ? 'lighter' : 'light'}'>
      <!-- profile -->
      <span class='mr-3'>
        <Badge class='success-color' dot bottom offsetX={10} offsetY={10} active={data.commiters.filter(c => c.id === log.commiter)[0].online}>
          <Avatar class='has-background-white elevation-1'>
            {#if data.commiters.filter(c => c.id === log.commiter)[0].profile !== ''}
            <img src="{data.commiters.filter(c => c.id === log.commiter)[0].profile}" alt="{data.commiters.filter(c => c.id === log.commiter)[0].firstName} {data.commiters.filter(c => c.id === log.commiter)[0].lastName}">
            {:else}
              <Icon class='{data.commiters.filter(c => c.id === log.commiter)[0].gender === 'Male' ? 'blue-text' : 'pink-text'}' path={mdiAccountOutline} />
            {/if}
          </Avatar>
        </Badge>
      </span>
      
      <!-- message -->
      <span on:mouseleave={() => {hoveringName = ''}} on:mouseenter={() => {hoveringName = log.id}} class='has-text-link'>{data.commiters.filter(c => c.id === log.commiter)[0].firstName} {data.commiters.filter(c => c.id === log.commiter)[0].lastName}</span> {log.log}

      <span style='float: right'>
        {getDate(log.logDate.toISOString())}
      </span>

      {#if hoveringName === log.id}
        <div class='pos-abs z-40 has-background-white-bis elevation-2 rounded p-3'>
           <!-- profile -->
            <span class='mr-3 maxmins-w-100p centerxy'>
              <Avatar class='has-background-white elevation-1'>
                {#if data.commiters.filter(c => c.id === log.commiter)[0].profile !== ''}
                <img src="{data.commiters.filter(c => c.id === log.commiter)[0].profile}" alt="{data.commiters.filter(c => c.id === log.commiter)[0].firstName} {data.commiters.filter(c => c.id === log.commiter)[0].lastName}">
                {:else}
                  <Icon class='{data.commiters.filter(c => c.id === log.commiter)[0].gender === 'Male' ? 'blue-text' : 'pink-text'}' path={mdiAccountOutline} />
                {/if}
              </Avatar>
            </span>

            <Divider class='mt-3 mb-0 p-0' />

            <!-- name -->
            <div class='mt-3'>
              {data.commiters.filter(c => c.id === log.commiter)[0].firstName} {data.commiters.filter(c => c.id === log.commiter)[0].lastName}
            </div>

            <!-- email -->
            <div class='txt-size-12'>
              {data.commiters.filter(c => c.id === log.commiter)[0].email}
            </div>

            <!-- age and gender -->
            <div class='is-flex is-align-items-center'>
              <!-- gender -->
              <div class='txt-size-12 mr-5'>
                {data.commiters.filter(c => c.id === log.commiter)[0].gender}
              </div>

              <!-- age -->
              <div class='txt-size-12'>
                {data.commiters.filter(c => c.id === log.commiter)[0].age} yrs. old
              </div>
            </div>

            <Divider class='mt-3 mb-0 p-0' />

            <!-- school -->
            <div class='mt-3 txt-size-13'>
              {data.commiters.filter(c => c.id === log.commiter)[0].school}
            </div>
            
            <!-- course and year -->
            <div class='is-flex is-align-items-center'>
              <!-- course -->
              <div class='txt-size-12 mr-2'>
                {data.commiters.filter(c => c.id === log.commiter)[0].course}
              </div>

              -

              <!-- year -->
              <div class='txt-size-12 ml-2'>
                {data.commiters.filter(c => c.id === log.commiter)[0].year} 
              </div>
            </div>
        </div>
      {/if}
    </div>
  {/each}
</div>