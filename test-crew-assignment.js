// Test script to verify automatic crew assignment
// This can be run in the browser console or as a test

const testAutomaticCrewAssignment = async () => {
  console.log('=== Testing Automatic Crew Assignment ===');
  
  try {
    // 1. Get an installer to use as leader
    const installersRes = await fetch('/api/web/installers');
    const installers = await installersRes.json();
    console.log('Available installers:', installers.length);
    
    if (installers.length === 0) {
      console.error('No installers available for testing');
      return;
    }
    
    const testInstaller = installers[0];
    console.log('Using installer as leader:', testInstaller.name, testInstaller.surname);
    console.log('Current crew before assignment:', testInstaller.currentCrew);
    
    // 2. Create a test crew with this installer as leader
    const crewData = {
      name: `Test Crew ${Date.now()}`,
      leader: testInstaller._id || testInstaller.id,
      members: [],
      isActive: true
    };
    
    console.log('Creating crew with data:', crewData);
    
    const createRes = await fetch('/api/web/crews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(crewData)
    });
    
    if (!createRes.ok) {
      const error = await createRes.json();
      console.error('Failed to create crew:', error);
      return;
    }
    
    const newCrew = await createRes.json();
    console.log('✅ Crew created:', newCrew.name, 'ID:', newCrew._id);
    
    // 3. Check if the installer's currentCrew was updated
    const updatedInstallerRes = await fetch(`/api/web/installers?id=${testInstaller._id || testInstaller.id}`);
    const updatedInstaller = await updatedInstallerRes.json();
    
    console.log('Installer after crew creation:');
    console.log('  - Name:', updatedInstaller.name, updatedInstaller.surname);
    console.log('  - Current Crew:', updatedInstaller.currentCrew);
    
    if (updatedInstaller.currentCrew === newCrew._id.toString()) {
      console.log('✅ SUCCESS: Installer\'s currentCrew was automatically updated!');
    } else {
      console.log('❌ FAILED: Installer\'s currentCrew was NOT updated');
      console.log('   Expected:', newCrew._id.toString());
      console.log('   Got:', updatedInstaller.currentCrew);
    }
    
    // 4. Verify in the installers list
    const allInstallersRes = await fetch('/api/web/installers');
    const allInstallers = await allInstallersRes.json();
    const installerInList = allInstallers.find(i => i.id === testInstaller.id || i._id === testInstaller._id);
    
    console.log('Installer in list view:');
    console.log('  - Current Crew:', installerInList?.currentCrew);
    
    if (installerInList?.currentCrew === newCrew.name) {
      console.log('✅ SUCCESS: Crew name is displayed in the installers list!');
    } else {
      console.log('⚠️  Crew in list:', installerInList?.currentCrew);
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
};

// To run this test:
// 1. Open browser console on your app
// 2. Copy and paste this entire file
// 3. Run: testAutomaticCrewAssignment()

console.log('Test function loaded. Run: testAutomaticCrewAssignment()');
