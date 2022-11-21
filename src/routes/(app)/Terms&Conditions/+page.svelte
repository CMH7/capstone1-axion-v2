<script>
  //@ts-nocheck
  let innerWidth = 0
</script>

<svelte:window bind:innerWidth />

<div class="hero-body p-0">
  <div class="columns m-5 mx-5 is-flex is-justify-content-center is-multiline is-align-items-center">
    <div class="column mt-0 is-align-items-center is-mobile">
      <p class=" mt-4 mb-5 is-primary has-text-centered fredokaone is-mobile {innerWidth < 571 ? 'txt-size-15' : 'txt-size-20'}">
          Terms and Conditions
      </p>

      <!-- Paragraphs/Texts about Axion --> 
      <div class="is-justify-content-center is-align-content-center">      
        <p class="fredoka-reg has-text-centered {innerWidth < 571 ? 'txt-size-10' : 'txt-size-15'}"> 
          Welcome to Axion, an academic web-based task management system. We appreciate you coming here. In our terms and conditions, the “Service” refers to the application or website that you are interacting with, whereas ”Axion” serves as the system itself, including the database and so forth. (“we”, “our”, or “us”) refers to the developers. This policy applies worldwide and we are the only team that controls your data.
        </p>
        <br/>
        <p class="fredoka-reg has-text-centered {innerWidth < 571 ? 'txt-size-10' : 'txt-size-15'}">
          As we solemnly advise you to read this, we want to give you a note that it is our obligation to explain this policy in such detail. We want to ensure that acceptable behavior of using our Service is being conducted within the reach of Axion, for this policy will serve on behalf of Axion in case any future legal disputes may occur. That having been said, by reading this policy, you will understand how our rules cover our Service and revolve within Axion, as well as our <a class="hover-txt-style-underline" href="/Privacy_Policy" >Privacy policy</a>.
        </p>
      </div>   

      <br/>


      <div class="content">
        <p class="fredoka-reg has-text-centered {innerWidth < 571 ? 'txt-size-10' : 'txt-size-15'} has-text-justified has-text-weight-bold">
          The following topics are being addressed:
        </p>
        <ul class="fredoka-reg {innerWidth < 571 ? 'txt-size-10' : 'txt-size-15'}">
          <li>Limitation of liability</li>
          <li>Rules and conditions</li>
          <li>Feedback statement</li>
          <li>Further updates in our terms and conditions</li>
        </ul>
      </div>

      <br/>
      
      <p class="fredoka-reg has-text-justified {innerWidth < 571 ? 'txt-size-10' : 'txt-size-15'} ">
        By accessing and using our Service, you acknowledge that you have read, understand, and agree to be bound by our privacy policy. If you do not wish for your data to be collected, used, and disclosed by us for personal reasons and privacy concerns, please halt and discontinue using our Service.
      </p>

      <br/>

      <p class="fredoka-reg has-text-justified {innerWidth < 571 ? 'txt-size-10' : 'txt-size-15'} has-text-weight-bold">
        Limitation of liability
      </p>
      <p class="fredoka-reg has-text-justified {innerWidth < 571 ? 'txt-size-10' : 'txt-size-15'}">
        We want to disclaim our liability for malicious attacks, or any form that could cause damage to your device. We do not intend, plan, and tolerate to have ads, nor viruses within our Service, thus in any case that your device is infected, our Service will not be suspected. Users sharing files that contain malicious code will be held accountable for any further damage it can cost to Axion, or to other users.
      </p>

      <br/>
      
      <div class="content">
        <p class="fredoka-reg has-text-justified {innerWidth < 571 ? 'txt-size-10' : 'txt-size-15'} has-text-weight-bold">
        Furthermore, we warranty for not being responsible towards the following areas:
        </p>
        <ul class="fredoka-reg has-text-justified {innerWidth < 571 ? 'txt-size-10' : 'txt-size-15'}">
          <li>Service downtime</li>
          <li>User satisfaction</li>
          <li>Errors or inaccuracies, such as typos</li>
        </ul>
      </div>

      <br/>

      <p class="fredoka-reg has-text-justified {innerWidth < 571 ? 'txt-size-10' : 'txt-size-15'} has-text-weight-bold">
        Rules and conditions
      </p>
      <p class="fredoka-reg has-text-justified {innerWidth < 571 ? 'txt-size-10' : 'txt-size-15'}">
        Our service must only be used specifically for its intended purposes only, and not for the purpose of harm, fraudulence, discrimination, and such. We warrant that you are at least 18 years old and above, in which you will be permitted to access our Service. You must not distribute, sell, display, reproduce, disarrange, translate, and exploit Axion, and any portions of it, including the logo, images, design, textual information, etc. You will also agree not to engage in any inappropriate, illegal, violent, and harmful actions or behavior that will negatively affect the performance of Axion and/or other users. The said further actions or behavior can be the following, but are not limited to:
      </p>

      <div class="content">
        <ul class="fredoka-reg has-text-justified {innerWidth < 571 ? 'txt-size-10' : 'txt-size-15'}">
          <li>Uploading malicious code</li>
          <li>Accessing data that you are not allowed to access</li>
          <li>Sharing or displaying inappropriate, misleading information within Axion</li>
        </ul>
      </div>

      <br/>

      <p class="fredoka-reg has-text-justified {innerWidth < 571 ? 'txt-size-10' : 'txt-size-15'}">
        We acquire the right to refuse our Service and terminate user accounts, if we believe that user has violated our discretion of rules.
      </p>

      <br/>

      <p class="fredoka-reg has-text-justified {innerWidth < 571 ? 'txt-size-10' : 'txt-size-15'} has-text-weight-bold">
        Feedback statement
      </p>
      <p class="fredoka-reg has-text-justified {innerWidth < 571 ? 'txt-size-10' : 'txt-size-15'}">
        You may contact us and provide your feedback using our Contact Us page, regarding our Terms and Conditions, our Privacy Policy, or other matters that are not discussed and may need to be elaborated further.
      </p>

      <br/>

      <p class="fredoka-reg has-text-justified {innerWidth < 571 ? 'txt-size-10' : 'txt-size-15'} has-text-weight-bold">
        Further updates in our terms and conditions
      </p>
      <p class="fredoka-reg has-text-justified {innerWidth < 571 ? 'txt-size-10' : 'txt-size-15'}">
        In case we decide to change or update our terms and conditions, we will post them in here and update the effective date that is located above.
      </p>
    </div> 
  </div>
</div>